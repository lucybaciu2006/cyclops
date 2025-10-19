import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import {env} from "../config/env";

interface JwtPayload {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            principal?: any;
            file?: any;
        }
    }
}

// List of public routes that don't require authentication
const publicRoutes = [
    '/api/auth/login',
    '/api/auth/oauth-login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/model/getSession',
    '/api/scan'
];

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === 'OPTIONS') {
        return next(); // Skip token check for CORS preflight requests
    }
    // Check if the current route is in the public routes list
    if (req.path.startsWith('/api/public') || publicRoutes.includes(req.path)) {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            console.log('Access denied. No token provided.');
            return;
        }

        const decoded = jwt.verify(token, env.JWT_SECRET || 'your-secret-key') as JwtPayload;
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            console.log('User not found.');
            return;
        }

        req.principal = user;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Invalid token.' });
        return;
    }
};
