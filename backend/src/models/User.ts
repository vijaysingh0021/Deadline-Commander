import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  level: number;
  xp: number;
  gold: number;
  streak: number;
  snapshot?: Record<string, unknown>;
  snapshotUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  gold: { type: Number, default: 100 },
  streak: { type: Number, default: 0 },
  snapshot: { type: Schema.Types.Mixed, default: undefined },
  snapshotUpdatedAt: { type: Date, default: undefined }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);