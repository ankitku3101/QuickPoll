'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { BarChart, X, Filter, Heart, Star } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import CreatePollForm from '@/components/CreatePollForm';
import PollCard from '@/components/PollCard';
import { api, setAuthHeaders, clearAuthHeaders } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';

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

const DottedDiv = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute -left-6 top-4 h-[1.5px] w-[calc(100%+3rem)] bg-sidebar" />
    <div className="absolute -left-6 bottom-4 h-[1.5px] w-[calc(100%+3rem)] bg-sidebar" />
    <div className="absolute left-4 -top-6 w-[1.5px] h-[calc(100%+3rem)] bg-sidebar" />
    <div className="absolute right-4 -top-6 w-[1.5px] h-[calc(100%+3rem)] bg-sidebar" />
    <div className="absolute left-[12.5px] top-[12.5px] z-10 size-2 rounded-full bg-foreground" />
    <div className="absolute right-[12.5px] top-[12.5px] z-10 size-2 rounded-full bg-foreground" />
    <div className="absolute bottom-[12.5px] left-[12.5px] z-10 size-2 rounded-full bg-foreground" />
    <div className="absolute bottom-[12.5px] right-[12.5px] z-10 size-2 rounded-full bg-foreground" />
    {children}
  </div>
);

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');


  // Fetch polls with proper error handling
  const fetchPolls = useCallback(async () => {
    try {
      const response = await api.get<PollResponse>('/api/polls');
      setPolls(response.data.polls || []);
      setUserVotes(response.data.userVotes || {});
      setUserLikes(response.data.userLikes || {});
    } catch (error) {
      console.error('Failed to fetch polls:', error);
      setPolls([]);
      setUserVotes({});
      setUserLikes({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter polls based on mode
  const filteredPolls = useMemo(() => {
    if (filterMode === 'my' && user?.id) {
      return polls.filter(poll => poll.createdBy === user.id);
    }
    return polls;
  }, [polls, filterMode, user?.id]);

  // Setup socket listeners
  useEffect(() => {
    fetchPolls();

    const socket = getSocket();

    socket.on('poll-created', (poll: Poll) => {
      setPolls((prev) => {
        if (prev.some((p) => p._id === poll._id)) return prev;
        return [poll, ...prev];
      });
    });

    socket.on('poll-updated', (updatedPoll: Poll) => {
      setPolls((prev) =>
        prev.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
      );
    });

    socket.on('poll-deleted', ({ pollId }: { pollId: string }) => {
      setPolls((prev) => prev.filter((poll) => poll._id !== pollId));
      setUserVotes((prev) => {
        const updated = { ...prev };
        delete updated[pollId];
        return updated;
      });
      setUserLikes((prev) => {
        const updated = { ...prev };
        delete updated[pollId];
        return updated;
      });
    });

    socket.on('poll-voted', ({ pollId, poll }: { pollId: string; poll: Poll }) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? poll : p))
      );
    });

    socket.on('poll-liked', ({ pollId, poll }: { pollId: string; poll: Poll }) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? poll : p))
      );
    });

    return () => {
      socket.off('poll-created');
      socket.off('poll-updated');
      socket.off('poll-deleted');
      socket.off('poll-voted');
      socket.off('poll-liked');
    };
  }, [fetchPolls]);

  const handlePollCreated = useCallback(async (newPoll: Poll) => {
    setShowCreateModal(false);
    await fetchPolls();
    setAnimationKey(prev => prev + 1);
  }, [fetchPolls]);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-background py-10 sm:py-20">
        <div className="container mx-auto px-4">
          <DottedDiv>
            <div className="grid lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex w-full flex-col gap-8 px-10 py-20 md:px-14"
              >
                <div className="flex w-fit items-center gap-1 rounded-full border border-border px-4 py-2 transition-all ease-in-out">
                  <BarChart className="size-4 animate-pulse text-green-400" />
                  <span className="text-muted-foreground text-xs sm:text-sm font-medium tracking-tight mt-0.5">
                    Real-time polling made simple
                  </span>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-5xl font-display tracking-tighter md:text-7xl"
                >
                  Create & Share
                  <br />
                  Your Polls
                  <br />
                  Instantly.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-muted-foreground tracking-tight md:text-xl"
                >
                  A seamless way to create polls, engage your audience, and make smarter decisions through instant, real-time feedback.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex w-full gap-2"
                >
                  <button
                    onClick={() => isSignedIn ? setShowCreateModal(true) : null}
                    disabled={!isSignedIn}
                    className="text-md bg-primary text-primary-foreground h-12 w-fit rounded-full px-10 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isSignedIn ? 'Create a Poll' : 'Sign In to Create'}
                  </button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                <DottedDiv className="group size-full place-self-end p-4 lg:w-4/6">
                  <div className="bg-muted/50 group-hover:bg-muted relative h-full w-full p-4 transition-all ease-in-out min-h-[500px]">
                    <div className="relative h-full w-full overflow-hidden rounded-3xl">
                      <Image
                        src="/poll.jpg"
                        alt="Polling"
                        fill
                        className="object-cover object-center"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10"></div>
                    </div>

                    <div className="absolute top-4 -ml-4 flex h-full w-full flex-col items-center justify-between p-10 z-20">
                      <p className="text-white drop-shadow-lg flex w-full items-center text-xl tracking-tighter">
                        Voice Your Opinion with Quickpoll
                      </p>
                      <div className="mb-6">
                        <div className="text-center">
                          <p className="text-white/90 m-10 max-w-sm px-2 text-center text-sm tracking-tight">
                            Join thousands of users sharing their opinions and making decisions together.
                          </p>
                          <p className="text-white drop-shadow-lg text-xl tracking-tight text-center">
                            {polls.length} Active {polls.length === 1 ? 'Poll' : 'Polls'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DottedDiv>
              </motion.div>
            </div>
          </DottedDiv>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6 mx-auto px-4">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight mb-3">
                {filterMode === 'my' ? 'My Polls' : 'All Polls'}
              </h2>
              <div className="h-1 w-12 bg-foreground rounded-full mb-4" />
              <p className="text-muted-foreground tracking-tight">
                {filteredPolls.length} {filteredPolls.length === 1 ? 'poll' : 'polls'} available
              </p>
            </div>

            {isSignedIn && (
              <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-6 py-2 rounded-full text-sm font-medium tracking-tight transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Polls
                </button>
                <button
                  onClick={() => setFilterMode('my')}
                  className={`px-6 py-2 rounded-full text-sm font-medium tracking-tight transition-all cursor-pointer ${
                    filterMode === 'my'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Polls
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-foreground"></div>
            <p className="mt-6 text-muted-foreground tracking-tight">Loading polls...</p>
          </div>
        ) : filteredPolls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto bg-muted/50 rounded-3xl py-20 text-center"
          >
            <p className="text-muted-foreground text-lg tracking-tight mb-4">
              {filterMode === 'my' 
                ? "You haven't created any polls yet."
                : 'No polls yet. Be the first to create one!'}
            </p>
            {filterMode === 'my' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
              >
                Create Your First Poll
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${animationKey}-${filterMode}`}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            {filteredPolls.map((poll) => (
              <motion.div
                key={poll._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                className="break-inside-avoid"
              >
                <PollCard
                  poll={poll}
                  userVote={userVotes[poll._id]}
                  userLiked={userLikes[poll._id]}
                  currentUserId={user?.id}
                  onUpdate={fetchPolls}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl my-8"
          >
            <div className="relative">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute -right-2 -top-2 z-10 size-10 rounded-full bg-background border border-border hover:bg-muted flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
              <CreatePollForm onPollCreated={handlePollCreated} />
            </div>
          </motion.div>
        </motion.div>
      )}
      <footer className="w-full py-6 text-center text-sm text-foreground border-t border-border mt-10 space-y-4">
        <div className='flex items-center justify-center gap-2'>
          Made with <span><Heart fill='#fb2c36' className="h-4 w-4 text-red-500" aria-hidden="true" /></span> by{' '}
          <Link
            href="https://github.com/ankitku3101"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ring"
            aria-label="Ankit's GitHub profile (opens in new tab)"
          >
            ankitku3101
          </Link>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <span>Star it on GitHub</span>

          <Link
            href="https://github.com/ankitku3101/Quickpoll"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-ring/20 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Star the Quickpoll repo on GitHub (opens in new tab)"
          >
            <FaGithub className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">Quickpoll</span>
            <span className="sr-only"> — star on GitHub</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}