'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Header from '@/components/Header';
import CreatePollForm from '@/components/CreatePollForm';
import PollCard from '@/components/PollCard';
import { api, setAuthHeaders, clearAuthHeaders } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: Array<{ id: string; text: string; votes: number }>;
  createdBy: string;
  createdByName: string;
  totalVotes: number;
  likes: number;
  createdAt: string;
}

interface PollResponse {
  polls: Poll[];
  userVotes: Record<string, string>;
  userLikes: Record<string, boolean>;
}

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      const userName = user.firstName || user.username || 'Anonymous';
      const userEmail = user.primaryEmailAddress?.emailAddress;
      setAuthHeaders(user.id, userName, userEmail);
    } else {
      clearAuthHeaders();
    }
  }, [isSignedIn, user]);

  const fetchPolls = async () => {
    try {
      const response = await api.get<PollResponse>('/api/polls');
      setPolls(response.data.polls);
      setUserVotes(response.data.userVotes || {});
      setUserLikes(response.data.userLikes || {});
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();

    const socket = getSocket();

    socket.on('poll-created', (poll: Poll) => {
      setPolls((prev) => [poll, ...prev]);
    });

    socket.on('poll-updated', (updatedPoll: Poll) => {
      setPolls((prev) =>
        prev.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
      );
    });

    socket.on('poll-deleted', ({ pollId }: { pollId: string }) => {
      setPolls((prev) => prev.filter((poll) => poll._id !== pollId));
    });

    socket.on('poll-voted', ({ poll }: { poll: Poll }) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === poll._id ? poll : p))
      );
    });

    socket.on('poll-liked', ({ poll }: { poll: Poll }) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === poll._id ? poll : p))
      );
    });

    return () => {
      socket.off('poll-created');
      socket.off('poll-updated');
      socket.off('poll-deleted');
      socket.off('poll-voted');
      socket.off('poll-liked');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {isSignedIn ? (
          <>
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {showCreateForm ? '− Hide Poll Form' : '+ Create New Poll'}
              </button>
            </div>

            {showCreateForm && (
              <CreatePollForm
                onPollCreated={() => {
                  setShowCreateForm(false);
                  fetchPolls();
                }}
              />
            )}
          </>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6 text-center">
            <h2 className="text-xl font-bold mb-2">Welcome to QuickPoll!</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Sign in to create polls and vote on existing ones.
            </p>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-2xl font-bold">All Polls</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {polls.length} {polls.length === 1 ? 'poll' : 'polls'} available
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">No polls yet. Be the first to create one!</p>
          </div>
        ) : (
          <div>
            {polls.map((poll) => (
              <PollCard
                key={poll._id}
                poll={poll}
                userVote={userVotes[poll._id]}
                userLiked={userLikes[poll._id]}
                currentUserId={user?.id}
                onUpdate={fetchPolls}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
