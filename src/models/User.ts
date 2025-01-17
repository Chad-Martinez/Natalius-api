import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/User.interface';

const userScheama = new Schema<IUser>(
  {
    stageName: {
      type: String,
      required: [true, 'Stage name required'],
    },
    email: {
      type: String,
      required: [true, 'Email required'],
      unique: true,
      lowercase: true,
      validate: {
        validator: (v: string) =>
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            v,
          ),
        message: 'Must be a valid email',
      },
    },
    hashedPw: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: [String],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

userScheama.index({ email: 1 });

export default model<IUser>('User', userScheama);
