'use client';

import { useState, useMemo, useEffect, useCallback, use } from 'react';
import { Heart, Users, Trash2, Calendar, AlertCircle, LogIn } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Optimistic state
  const [optimisticVote, setOptimisticVote] = useState<string | null>(null);
  const [optimisticLike, setOptimisticLike] = useState<boolean | null>(null);

  const hasVoted = !!userVote || !!optimisticVote;
  const isLiked = optimisticLike !== null ? optimisticLike : !!userLiked;
  const currentVote = optimisticVote || userVote;
  const isAuthenticated = !!currentUserId;
  const isOwner = isAuthenticated && currentUserId === poll.createdBy;

  // Sync optimistic state when props change
  useEffect(() => {
    setOptimisticVote(null);
    setOptimisticLike(null);
  }, [userVote, userLiked]);

  // Auto-dismiss errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Memoized date formatting
  const formattedDate = useMemo(() => {
    try {
      const date = new Date(poll.createdAt);
      if (date.getTime() > Date.now() + 60000) return 'Recently';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  }, [poll.createdAt]);

  // Memoized percentage calculations
  const optionStats = useMemo(() => {
    if (!poll.options?.length) return [];
    
    const total = Math.max(poll.totalVotes, 0);
    const stats = poll.options.map((option) => {
      const votes = Math.max(option.votes, 0);
      const percentage = total === 0 ? 0 : Math.round((votes / total) * 100);
      return { id: option.id, text: option.text, votes, percentage };
    });

    // Adjust percentages to sum to 100%
    if (total > 0 && stats.length) {
      const sum = stats.reduce((acc, s) => acc + s.percentage, 0);
      if (sum !== 100) {
        const maxIndex = stats.reduce((maxIdx, s, idx, arr) => 
          s.votes > arr[maxIdx].votes ? idx : maxIdx, 0);
        stats[maxIndex].percentage += (100 - sum);
      }
    }

    return stats;
  }, [poll.options, poll.totalVotes]);

  const formatCount = useCallback((count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting) return;
    
    if (!isAuthenticated) {
      toast.error('Please sign in to vote on polls.');
      return;
    }

    if (!poll.options.find(opt => opt.id === optionId)) {
      setError('Invalid option selected');
      return;
    }
    
    setOptimisticVote(optionId);
    setVoting(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setVoting(false);
      setOptimisticVote(null);
      setError('Vote request timed out. Please try again.');
    }, 10000);

    try {
      await api.post(`/api/polls/${poll._id}/vote`, { optionId });
      clearTimeout(timeoutId);
      onUpdate();
    } catch (err: any) {
      clearTimeout(timeoutId);
      setOptimisticVote(null);
      
      let errorMessage = 'Failed to submit vote. Please try again.';
      if (err.response?.status === 401) errorMessage = 'Please sign in to vote.';
      else if (err.response?.status === 403) errorMessage = 'Not allowed to vote on this poll.';
      else if (err.response?.status === 409) errorMessage = 'You have already voted on this poll.';
      else if (!navigator.onLine) errorMessage = 'No internet connection.';
      
      setError(errorMessage);
      console.error('Vote failed:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    
    if (!isAuthenticated) {
      toast.error('Please sign in to like on polls.');
      return;
    }
    
    const newLikeState = !isLiked;
    setOptimisticLike(newLikeState);
    setLiking(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setLiking(false);
      setOptimisticLike(null);
      setError('Like request timed out. Please try again.');
    }, 10000);

    try {
      await api.post(`/api/polls/${poll._id}/like`);
      clearTimeout(timeoutId);
      onUpdate();
    } catch (err: any) {
      clearTimeout(timeoutId);
      setOptimisticLike(null);
      
      let errorMessage = 'Failed to like poll. Please try again.';
      if (err.response?.status === 401) errorMessage = 'Please sign in to like polls.';
      else if (!navigator.onLine) errorMessage = 'No internet connection.';
      
      setError(errorMessage);
      console.error('Like failed:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setDeleting(false);
      setError('Delete request timed out. Please try again.');
    }, 10000);

    try {
      await api.delete(`/api/polls/${poll._id}`);
      clearTimeout(timeoutId);
      setDeleteDialogOpen(false);
      onUpdate();
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      let errorMessage = 'Failed to delete poll. Please try again.';
      if (err.response?.status === 401) errorMessage = 'Please sign in to delete this poll.';
      else if (err.response?.status === 403) errorMessage = 'Not authorized to delete this poll.';
      else if (err.response?.status === 404) {
        errorMessage = 'This poll has already been deleted.';
        setDeleteDialogOpen(false);
        onUpdate();
      } else if (!navigator.onLine) errorMessage = 'No internet connection.';
      
      setError(errorMessage);
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (!poll.options?.length) {
    return (
      <div className="bg-muted/50 rounded-3xl p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>This poll has no options available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fixed: Calculate display likes correctly
  const displayLikes = optimisticLike !== null 
    ? (optimisticLike ? poll.likes + 1 : poll.likes - 1)
    : poll.likes;

  return (
    <div className="bg-muted/50 hover:bg-muted rounded-3xl p-8 transition-all h-full flex flex-col">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 text-xs tracking-tight text-muted-foreground">
            <Calendar className="size-3 shrink-0" aria-hidden="true" />
            <span>{formattedDate}</span>
            <span className="bg-foreground h-2.5 w-[1px]" aria-hidden="true" />
            <span className="truncate">
              {poll.createdByName.startsWith("guest_") ? "GuestUser" : poll.createdByName}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-2 break-words">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-muted-foreground text-sm tracking-tight leading-relaxed break-words">
              {poll.description}
            </p>
          )}
        </div>

        {isOwner && (
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="ml-3 size-11 md:size-9 flex items-center justify-center rounded-full cursor-pointer bg-background border border-muted hover:border-destructive hover:bg-destructive/10 text-destructive transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                aria-label="Delete poll"
              >
                <Trash2 className="size-4" aria-hidden="true" />
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
                <Button variant="outline" className='cursor-pointer' onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" className='cursor-pointer' onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="h-[1px] w-10 bg-foreground rounded-full mb-6" aria-hidden="true" />

      {/* Options */}
      <div className="space-y-3 mb-6 flex-1" role="group" aria-label="Poll options">
        {optionStats.map((option) => {
          const isUserChoice = currentVote === option.id;
          
          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleVote(option.id)}
                disabled={voting || hasVoted}
                className={`w-full text-left px-5 py-3 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isUserChoice
                    ? 'border-foreground bg-background focus:ring-foreground'
                    : hasVoted
                    ? 'border-muted bg-background'
                    : 'border-muted bg-background hover:border-foreground/50 focus:ring-foreground/50'
                } ${voting || hasVoted || !isAuthenticated ? 'cursor-default' : 'cursor-pointer'}`}
                aria-label={`Vote for ${option.text}. ${option.votes} votes, ${option.percentage} percent`}
                aria-pressed={isUserChoice}
              >
                {/* Only show percentage bar if user has voted */}
                {hasVoted && (
                  <div
                    className="absolute left-0 top-0 h-full bg-foreground/10 transition-all duration-300"
                    style={{ width: `${option.percentage}%` }}
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex justify-between items-center gap-3">
                  <span className="font-medium tracking-tight break-words flex-1 pr-3">
                    {option.text}
                    {isUserChoice && (
                      <span className="ml-2 text-xs bg-foreground text-background px-2 py-0.5 rounded-full">
                        Your vote
                      </span>
                    )}
                  </span>
                  {/* Always show vote counts and percentages */}
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-tight shrink-0">
                    <span className="text-muted-foreground">{formatCount(option.votes)}</span>
                    <span className={`px-2 py-1 rounded-full min-w-[3rem] text-center ${
                      hasVoted ? 'bg-foreground/10' : 'bg-muted'
                    }`}>
                      {option.percentage}%
                    </span>
                  </div>
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
          className={`flex items-center gap-1.5 transition-all font-medium tracking-tight text-sm cursor-pointer min-h-[44px] px-2 -mx-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground ${
            isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
          } ${liking || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} poll. ${displayLikes} likes`}
          aria-pressed={isLiked}
        >
          <Heart 
            className={`size-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''} ${liking ? 'animate-pulse' : ''}`} 
            aria-hidden="true"
          />
          <span>{formatCount(displayLikes)}</span>
        </button>
        <div 
          className="flex items-center gap-1.5 text-muted-foreground font-medium tracking-tight text-sm"
          role="status"
          aria-label={`${poll.totalVotes} total votes`}
        >
          <Users className="size-4" aria-hidden="true" />
          <span>{formatCount(poll.totalVotes)}</span>
        </div>
        <Link
          href={`/poll/${poll._id}`}
          className="ml-auto text-sm text-primary hover:underline font-medium"
        >
          Detailed View
        </Link>
      </div>

      {(voting || liking) && (
        <div className="sr-only" role="status" aria-live="polite">
          {voting ? 'Submitting vote...' : 'Processing like...'}
        </div>
      )}
    </div>
  );
}

