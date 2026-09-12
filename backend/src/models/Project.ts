import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'legendary'], default: 'medium' }
}, { timestamps: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
