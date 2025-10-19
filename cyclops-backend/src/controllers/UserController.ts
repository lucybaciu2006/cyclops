import { Request, Response } from 'express';

export class UserController {
    public static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const user = req.principal;
            res.json({
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                }
            });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
} 