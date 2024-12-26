import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any; // Add other properties if necessary
      };
    }
  }
}
