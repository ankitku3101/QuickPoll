import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  pollId: string;
  userId: string;
  createdAt: Date;
}

const LikeSchema = new Schema({
  pollId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one like per user per poll
LikeSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', LikeSchema);
