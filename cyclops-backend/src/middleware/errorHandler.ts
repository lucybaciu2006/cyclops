// src/middleware/ErrorHandler.ts
import {NextFunction, Request, Response} from 'express';
import {BusinessError} from '../errors/BusinessError';
import {CriticalError} from '../errors/CriticalError';
import {AdminNotificationEvent, NotificationService} from "../services/NotificationService";
import {ValidationError} from "../core/validators/ValidationError";

export function ErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof BusinessError) {
        return res.status(503).json({status: 503, code: err.code });
    }

    if (err instanceof CriticalError) {
        // Log if needed
        console.error('Critical error:', err);
        NotificationService.notifyAdmins(AdminNotificationEvent.CRITICAL_ERROR, {error: err.message});
        return res.status(500).json({ error: 'A critical server error occurred.' });
    }

    if (err instanceof ValidationError) {
        return res.status(400).json({ errors: err.issues });
    }

    // Catch-all
    console.error('Unexpected error:', err);
    NotificationService.notifyAdmins(AdminNotificationEvent.INTERNAL_ERROR, {error: err.message});
    return res.status(500).json({ error: 'An unexpected error occurred.' });
}
