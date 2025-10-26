'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

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

  const handleVote = async (optionId: string) => {
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
    if (confirm('Are you sure you want to delete this poll?')) {
      try {
        await api.delete(`/api/polls/${poll._id}`);
        onUpdate();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const hasVoted = !!userVote;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">{poll.title}</h3>
          {poll.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{poll.description}</p>
          )}
          <p className="text-xs text-gray-500">
            by {poll.createdByName} • {new Date(poll.createdAt).toLocaleDateString()}
          </p>
        </div>
        {currentUserId === poll.createdBy && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = userVote === option.id;
          
          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => !voting && handleVote(option.id)}
                disabled={voting}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                } ${voting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {hasVoted && (
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-200 dark:bg-blue-700/30 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative flex justify-between items-center">
                  <span className="font-medium">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm font-bold">
                      {option.votes} ({percentage}%)
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
            userLiked ? 'text-red-500' : ''
          }`}
        >
          <span className="text-lg">{userLiked ? '❤️' : '🤍'}</span>
          <span>{poll.likes}</span>
        </button>
        <span>👥 {poll.totalVotes} votes</span>
      </div>
    </div>
  );
}
