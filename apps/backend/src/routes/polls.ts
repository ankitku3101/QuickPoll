import express from 'express';
import Poll from '../models/Poll';
import Vote from '../models/Vote';
import Like from '../models/Like';
import { authenticateUser, optionalAuth, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index';

const router = express.Router();

// Get all polls with user-specific data
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 }).lean();
    
    let userVotes: Record<string, string> = {};
    let userLikes: Record<string, boolean> = {};
    
    if (req.user) {
      const [votes, likes] = await Promise.all([
        Vote.find({ userId: req.user.id }).lean(),
        Like.find({ userId: req.user.id }).lean()
      ]);
      
      votes.forEach(vote => { userVotes[vote.pollId] = vote.optionId; });
      likes.forEach(like => { userLikes[like.pollId] = true; });
    }
    
    res.json({ polls, userVotes, userLikes });
  } catch (error) {
    console.error('Fetch polls error:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Get single poll with user vote/like
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    
    let userVote = null;
    let userLiked = false;
    
    if (req.user) {
      const [vote, like] = await Promise.all([
        Vote.findOne({ pollId: req.params.id, userId: req.user.id }).lean(),
        Like.findOne({ pollId: req.params.id, userId: req.user.id }).lean()
      ]);
      
      if (vote) userVote = vote.optionId;
      if (like) userLiked = true;
    }
    
    res.json({ poll, userVote, userLiked });
  } catch (error) {
    console.error('Fetch poll error:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// Create poll
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { title, description, options } = req.body;
    
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options required' });
    }
    
    const validOptions = options
      .map(text => text?.trim())
      .filter(text => text && text.length > 0);
    
    if (validOptions.length < 2) {
      return res.status(400).json({ error: 'At least 2 valid options required' });
    }
    
    const poll = await Poll.create({
      title: title.trim(),
      description: description?.trim() || undefined,
      options: validOptions.map(text => ({ id: uuidv4(), text, votes: 0 })),
      createdBy: req.user!.id,
      createdByName: req.user!.name,
      totalVotes: 0,
      likes: 0
    });
    
    io.emit('poll-created', poll);
    res.status(201).json(poll);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Vote on poll (no vote changes allowed - prevents gaming)
router.post('/:id/vote', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    
    if (!optionId) {
      return res.status(400).json({ error: 'Option ID required' });
    }
    
    // Check existing vote first (faster fail)
    const existingVote = await Vote.findOne({ pollId, userId: req.user!.id });
    if (existingVote) {
      return res.status(409).json({ 
        error: 'Already voted',
        userVote: existingVote.optionId 
      });
    }
    
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(400).json({ error: 'Invalid option' });
    }
    
    // Create vote and update poll atomically
    const [vote] = await Promise.all([
      Vote.create({
        pollId,
        optionId,
        userId: req.user!.id,
        userName: req.user!.name
      }),
      Poll.findByIdAndUpdate(
        pollId,
        {
          $inc: { 
            totalVotes: 1,
            'options.$[elem].votes': 1
          }
        },
        { 
          arrayFilters: [{ 'elem.id': optionId }],
          new: true
        }
      )
    ]);
    
    const updatedPoll = await Poll.findById(pollId);
    
    io.to(`poll-${pollId}`).emit('poll-updated', updatedPoll);
    io.emit('poll-voted', { pollId, poll: updatedPoll });
    
    res.json({ poll: updatedPoll, userVote: optionId });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Toggle like
router.post('/:id/like', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const pollId = req.params.id;
    
    const existingLike = await Like.findOne({ pollId, userId: req.user!.id });
    const increment = existingLike ? -1 : 1;
    
    const [poll] = await Promise.all([
      Poll.findByIdAndUpdate(
        pollId,
        { $inc: { likes: increment } },
        { new: true }
      ),
      existingLike 
        ? existingLike.deleteOne()
        : Like.create({ pollId, userId: req.user!.id })
    ]);
    
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    
    io.to(`poll-${pollId}`).emit('poll-updated', poll);
    io.emit('poll-liked', { pollId, poll });
    
    res.json({ poll, userLiked: !existingLike });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Delete poll
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    
    if (poll.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Promise.all([
      poll.deleteOne(),
      Vote.deleteMany({ pollId: req.params.id }),
      Like.deleteMany({ pollId: req.params.id })
    ]);
    
    io.emit('poll-deleted', { pollId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
});

export default router;