import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  xpReward: number;
  goldReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: { type: Date },
  xpReward: { type: Number, default: 50 },
  goldReward: { type: Number, default: 10 }
}, { timestamps: true });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
