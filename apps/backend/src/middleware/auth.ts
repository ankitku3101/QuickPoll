import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

// Simple auth middleware - extracts user from headers
export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const userName = req.headers['x-user-name'] as string;
  const userEmail = req.headers['x-user-email'] as string;

  if (!userId || !userName) {
    return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
  }

  req.user = {
    id: userId,
    name: userName,
    email: userEmail
  };

  next();
};

// Optional auth - doesn't fail if no user
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const userName = req.headers['x-user-name'] as string;
  const userEmail = req.headers['x-user-email'] as string;

  if (userId && userName) {
    req.user = {
      id: userId,
      name: userName,
      email: userEmail
    };
  }

  next();
};
