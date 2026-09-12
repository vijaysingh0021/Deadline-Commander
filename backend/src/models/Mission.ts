import mongoose, { Schema, Document } from 'mongoose';

export interface IMission extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  objective: string;
  deadline: Date;
  status: 'active' | 'completed' | 'failed';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  riskLevel: 'low' | 'moderate' | 'elevated' | 'critical';
  xpReward: number;
  goldReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const MissionSchema = new Schema<IMission>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  objective: { type: String, required: true, trim: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'legendary'], default: 'medium' },
  riskLevel: { type: String, enum: ['low', 'moderate', 'elevated', 'critical'], default: 'low' },
  xpReward: { type: Number, default: 200 },
  goldReward: { type: Number, default: 50 }
}, { timestamps: true });

export const Mission = mongoose.model<IMission>('Mission', MissionSchema);
