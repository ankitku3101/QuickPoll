export interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  totalVotes: number;
  likes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  _id: string;
  pollId: string;
  optionId: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface Like {
  _id: string;
  pollId: string;
  userId: string;
  createdAt: Date;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  options: string[];
}

export interface VoteRequest {
  pollId: string;
  optionId: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
}
