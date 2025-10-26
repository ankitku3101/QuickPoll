import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  pollId: string;
  optionId: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

const VoteSchema = new Schema({
  pollId: { type: String, required: true, index: true },
  optionId: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one vote per user per poll
VoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IVote>('Vote', VoteSchema);
