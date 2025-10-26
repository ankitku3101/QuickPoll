'use client';

import { useState } from 'react';
import { Heart, Users, Trash2, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  totalVotes: number;
  likes: number;
  createdAt: string;
}

interface PollCardProps {
  poll: Poll;
  userVote?: string;
  userLiked?: boolean;
  currentUserId?: string;
  onUpdate: () => void;
}

export default function PollCard({ poll, userVote, userLiked, currentUserId, onUpdate }: PollCardProps) {
  const [voting, setVoting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Derived state - don't store what can be computed
  const hasVoted = !!userVote;

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting) return;
    
    setVoting(true);
    try {
      await api.post(`/api/polls/${poll._id}/vote`, { optionId });
      onUpdate();
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    
    setLiking(true);
    try {
      await api.post(`/api/polls/${poll._id}/like`);
      onUpdate();
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/polls/${poll._id}`);
      onUpdate();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="bg-muted/50 hover:bg-muted rounded-3xl p-8 transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-xs tracking-tight text-muted-foreground">
            <Calendar className="size-3" />
            <span>{new Date(poll.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="bg-foreground h-2.5 w-[1px]" />
            <span>{poll.createdByName}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-muted-foreground text-sm tracking-tight leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {currentUserId === poll.createdBy && (
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <button className="ml-3 size-9 flex items-center justify-center rounded-full bg-background border border-muted hover:border-destructive hover:bg-destructive/10 text-destructive transition-all shrink-0">
                <Trash2 className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Poll?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this poll? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="h-[1px] w-10 bg-foreground rounded-full mb-6" />

      {/* Options */}
      <div className="space-y-3 mb-6 flex-1">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isUserChoice = userVote === option.id;
          
          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleVote(option.id)}
                disabled={voting || hasVoted}
                className={`w-full text-left px-5 py-3 rounded-xl border-2 transition-all relative overflow-hidden ${
                  isUserChoice
                    ? 'border-foreground bg-background'
                    : hasVoted
                    ? 'border-muted bg-background'
                    : 'border-muted bg-background hover:border-foreground/50'
                } ${voting || hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {hasVoted && (
                  <div
                    className="absolute left-0 top-0 h-full bg-foreground/10 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative flex justify-between items-center">
                  <span className="font-medium tracking-tight pr-3">{option.text}</span>
                  {hasVoted && (
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-tight shrink-0">
                      <span className="text-muted-foreground">{option.votes}</span>
                      <span className="bg-foreground/10 px-2 py-1 rounded-full">{percentage}%</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-muted">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 transition-all font-medium tracking-tight text-sm ${
            userLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
          } ${liking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart className={`size-4 ${userLiked ? 'fill-current' : ''}`} />
          <span>{poll.likes}</span>
        </button>
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium tracking-tight text-sm">
          <Users className="size-4" />
          <span>{poll.totalVotes}</span>
        </div>
      </div>
    </div>
  );
}