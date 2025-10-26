import express from 'express';
import Poll from '../models/Poll';
import Vote from '../models/Vote';
import Like from '../models/Like';
import { authenticateUser, optionalAuth, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index';

const router = express.Router();

// Get all polls
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    
    // If user is authenticated, get their votes and likes
    let userVotes: any = {};
    let userLikes: any = {};
    
    if (req.user) {
      const votes = await Vote.find({ userId: req.user.id });
      const likes = await Like.find({ userId: req.user.id });
      
      votes.forEach(vote => {
        userVotes[vote.pollId] = vote.optionId;
      });
      
      likes.forEach(like => {
        userLikes[like.pollId] = true;
      });
    }
    
    res.json({
      polls,
      userVotes,
      userLikes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Get single poll
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// Create poll
router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { title, description, options } = req.body;
    
    if (!title || !options || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 options required' });
    }
    
    const pollOptions = options.map((text: string) => ({
      id: uuidv4(),
      text,
      votes: 0
    }));
    
    const poll = new Poll({
      title,
      description,
      options: pollOptions,
      createdBy: req.user!.id,
      createdByName: req.user!.name,
      totalVotes: 0,
      likes: 0
    });
    
    await poll.save();
    
    // Emit socket event
    io.emit('poll-created', poll);
    
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Vote on poll
router.post('/:id/vote', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if option exists
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(400).json({ error: 'Invalid option' });
    }
    
    // Check if user already voted
    const existingVote = await Vote.findOne({ pollId, userId: req.user!.id });
    
    if (existingVote) {
      // Update vote
      const oldOption = poll.options.find(opt => opt.id === existingVote.optionId);
      if (oldOption) oldOption.votes--;
      
      option.votes++;
      existingVote.optionId = optionId;
      
      await existingVote.save();
      await poll.save();
    } else {
      // New vote
      const vote = new Vote({
        pollId,
        optionId,
        userId: req.user!.id,
        userName: req.user!.name
      });
      
      option.votes++;
      poll.totalVotes++;
      
      await vote.save();
      await poll.save();
    }
    
    // Emit socket event
    io.to(`poll-${pollId}`).emit('poll-updated', poll);
    io.emit('poll-voted', { pollId, poll });
    
    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Toggle like on poll
router.post('/:id/like', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const pollId = req.params.id;
    
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    const existingLike = await Like.findOne({ pollId, userId: req.user!.id });
    
    if (existingLike) {
      // Unlike
      await existingLike.deleteOne();
      poll.likes--;
    } else {
      // Like
      const like = new Like({
        pollId,
        userId: req.user!.id
      });
      await like.save();
      poll.likes++;
    }
    
    await poll.save();
    
    // Emit socket event
    io.to(`poll-${pollId}`).emit('poll-updated', poll);
    io.emit('poll-liked', { pollId, poll });
    
    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Delete poll
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    if (poll.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this poll' });
    }
    
    await poll.deleteOne();
    await Vote.deleteMany({ pollId: req.params.id });
    await Like.deleteMany({ pollId: req.params.id });
    
    // Emit socket event
    io.emit('poll-deleted', { pollId: req.params.id });
    
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete poll' });
  }
});

export default router;
