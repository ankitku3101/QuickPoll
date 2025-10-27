'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Share2,
  Heart,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  AlertCircle,
  Check,
  Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  poll: Poll;
  userVote?: string | null;
  userLiked?: boolean;
}

interface Analytics {
  totalVotes: number;
  totalLikes: number;
  winningOption: {
    text: string;
    votes: number;
    percentage: number;
  };
  votingTrend: string;
  engagement: number;
}

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    fetchPoll();
  }, [pollId, user]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      const response = await api.get<PollResponse>(`/api/polls/${pollId}`);
      setPoll(response.data.poll);
      setUserVote(response.data.userVote || null);
      setUserLiked(response.data.userLiked || false);
    } catch (err: any) {
      console.error('Failed to fetch poll:', err);
      setError(err.response?.status === 404 ? 'Poll not found' : 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user || userVote || voting) return;

    setVoting(true);
    setError(null);

    try {
      await api.post(`/api/polls/${pollId}/vote`, { optionId });
      await fetchPoll();
    } catch (err: any) {
      setError(err.response?.status === 409
        ? 'You have already voted on this poll'
        : 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const handleLike = async () => {
    if (!user || liking) return;

    setLiking(true);
    try {
      await api.post(`/api/polls/${pollId}/like`);
      await fetchPoll();
    } catch (err) {
      console.error('Failed to like poll:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'copy') => {
    const pollUrl = `${window.location.origin}/poll/${pollId}`;
    const shareText = `Check out this poll: ${poll?.title}`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + pollUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pollUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    }
  };

  const calculateAnalytics = (): Analytics | null => {
    if (!poll) return null;

    const winningOption = poll.options.reduce((max, opt) =>
      opt.votes > max.votes ? opt : max, poll.options[0]);

    const winningPercentage = poll.totalVotes > 0
      ? Math.round((winningOption.votes / poll.totalVotes) * 100)
      : 0;

    return {
      totalVotes: poll.totalVotes,
      totalLikes: poll.likes,
      winningOption: {
        text: winningOption.text,
        votes: winningOption.votes,
        percentage: winningPercentage
      },
      votingTrend: poll.totalVotes > 100 ? 'High engagement' : 'Growing',
      engagement: poll.totalVotes + poll.likes
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-foreground"></div>
          <p className="mt-6 text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Poll not found'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/')} className="mt-4 w-full cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <button
              onClick={() => setShareDialogOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Poll Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(poll.createdAt)}</span>
            <span className="mx-2">•</span>
            <span>by {poll.createdByName}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {poll.title}
          </h1>

          {poll.description && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {poll.description}
            </p>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Leading</span>
            </div>
            <p className="text-2xl font-bold">{analytics?.winningOption.percentage}%</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Votes</span>
            </div>
            <p className="text-2xl font-bold">{poll.totalVotes}</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Likes</span>
            </div>
            <p className="text-2xl font-bold">{poll.likes}</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Options</span>
            </div>
            <p className="text-2xl font-bold">{poll.options.length}</p>
          </div>

        </motion.div>

        {/* Poll Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-muted/30 rounded-3xl p-6 md:p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6">Cast Your Vote</h2>

          {!user && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Sign in to vote and like this poll</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {poll.options.map((option) => {
              const percentage = getPercentage(option.votes);
              const isUserChoice = userVote === option.id;
              const isWinning = analytics && option.text === analytics.winningOption.text;

              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={voting || !!userVote || !user}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all relative overflow-hidden cursor-pointer ${isUserChoice
                      ? 'border-foreground bg-background'
                      : userVote
                        ? 'border-muted bg-background'
                        : 'border-muted bg-background hover:border-foreground/50'
                    } ${voting || userVote || !user ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {userVote && (
                    <div
                      className="absolute left-0 top-0 h-full bg-foreground/10 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  )}

                  <div className="relative flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <span className="font-medium text-lg block mb-1">
                        {option.text}
                        {isUserChoice && (
                          <span className="ml-2 text-xs bg-foreground text-background px-2 py-1 rounded-full">
                            Your vote
                          </span>
                        )}
                        {isWinning && userVote && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            Leading
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground font-medium">
                        {option.votes} votes
                      </span>
                      <span className={`font-bold text-lg min-w-[4rem] text-right ${userVote ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Like Button */}
          <div className="mt-6 pt-6 border-t border-muted flex items-center justify-between">
            <button
              onClick={handleLike}
              disabled={!user || liking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${userLiked
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                } ${!user || liking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-5 w-5 ${userLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">
                {userLiked ? 'Liked' : 'Like'} ({poll.likes})
              </span>
            </button>
          </div>
        </motion.div>

        {/* Analytics Section */}
        {analytics && userVote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-muted/30 rounded-3xl p-6 md:p-8"
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Poll Analytics
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background rounded-xl p-6">
                <h3 className="text-sm text-muted-foreground mb-2">Current Leader</h3>
                <p className="text-2xl font-bold mb-1">{analytics.winningOption.text}</p>
                <p className="text-muted-foreground">
                  {analytics.winningOption.votes} votes ({analytics.winningOption.percentage}%)
                </p>
              </div>

              <div className="bg-background rounded-xl p-6">
                <h3 className="text-sm text-muted-foreground mb-2">Total Engagement</h3>
                <p className="text-2xl font-bold mb-1">{analytics.engagement}</p>
                <p className="text-muted-foreground">
                  {analytics.totalVotes} votes + {analytics.totalLikes} likes
                </p>
              </div>

              <div className="bg-background rounded-xl p-6">
                <h3 className="text-sm text-muted-foreground mb-2">Voting Trend</h3>
                <p className="text-2xl font-bold">{analytics.votingTrend}</p>
              </div>

              <div className="bg-background rounded-xl p-6">
                <h3 className="text-sm text-muted-foreground mb-2">Created</h3>
                <p className="text-lg font-medium">{formatDate(poll.createdAt)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Poll</DialogTitle>
            <DialogDescription>
              Share this poll with your friends and community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={() => handleShare('whatsapp')}
              className="w-full justify-start cursor-pointer"
              variant="outline"
            >
              <FaWhatsapp className="mr-2 h-4 w-4" />
              Share on WhatsApp
            </Button>

            <Button
              onClick={() => handleShare('twitter')}
              className="w-full justify-start cursor-pointer"
              variant="outline"
            >
              <FaXTwitter className="mr-2 h-4 w-4" />
              Share on Twitter
            </Button>

            <Button
              onClick={() => handleShare('copy')}
              className="w-full justify-start cursor-pointer"
              variant="outline"
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
