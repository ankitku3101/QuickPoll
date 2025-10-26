import mongoose, { Schema, Document } from 'mongoose';

export interface IPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  title: string;
  description?: string;
  options: IPollOption[];
  createdBy: string;
  createdByName: string;
  totalVotes: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const PollSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  options: [PollOptionSchema],
  createdBy: { type: String, required: true },
  createdByName: { type: String, required: true },
  totalVotes: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IPoll>('Poll', PollSchema);