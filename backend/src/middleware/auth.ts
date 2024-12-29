import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase-admin';

declare module 'express' {
  interface Request {
    user?: {
      uid: string;
      email: string;
      name?: string;
    };
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
      };

      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};
