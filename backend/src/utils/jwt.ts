import jwt from 'jsonwebtoken';
import { User } from '../models';

interface JWTPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  profileId?: number;
  profileType?: string;
}

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    profileId: user.profileId || undefined,
    profileType: user.profileType || undefined,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const generateRefreshToken = (user: User): string => {
  const payload: JWTPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    profileId: user.profileId || undefined,
    profileType: user.profileType || undefined,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};