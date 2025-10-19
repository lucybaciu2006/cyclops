import {Request, Response} from 'express';
import {AuthService} from '../services/AuthService';
import {BusinessError} from '../errors/BusinessError';
import {AdminNotificationEvent, NotificationService} from "../services/NotificationService";

export class AuthController {

    public static async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, name } = req.body;
            const { user, confirmToken } = await AuthService.register({ email, password, name });
            NotificationService.notifyAdmins(AdminNotificationEvent.USER_REGISTERED, {email: email});
            res.status(200).json({});
        } catch (error) {
            console.log('error', error);
            if (error instanceof BusinessError) {
                res.status(503).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }

    public static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            await AuthService.deleteUser(email, password);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(503).json({
                    message: error.message,
                    code: error.code
                });
            }
        }
    }

    public static async confirmEmail(req: Request, res: Response): Promise<void> {
        try {
            const token = req.query.token as string;
            if (!token) {
                res.status(503).json({
                    message: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                });
                return;
            }

            const loginResponse = await AuthService.confirmEmail(token);

            res.json(loginResponse);
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(503).json({
                    message: error.message,
                    code: error.code,
                    valid: false
            });
        } else {
                throw error;
            }
        }
    }

    public static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const { user, token } = await AuthService.login(email, password);
            res.json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isAdmin: user.isAdmin,
                    trialSecondsLeft: user.trialSecondsLeft
                },
                token
            });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(503).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }

    public static async loginWithExternalProvider(req: Request, res: Response): Promise<void> {
        try {
            const { provider, token } = req.body;

            if (!provider || !token) {
                res.status(400).json({
                    message: 'Missing provider or token',
                    code: 'MISSING_PARAMETERS'
                });
                return;
            }

            const loginResponse = await AuthService.loginWithExternalProvider(req.body.provider, req.body.token);
            const user = loginResponse.user;
            res.json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isAdmin: user.isAdmin
                },
                token: loginResponse.token
            });

            res.status(200);

        } catch (error) {
            console.error(error);
            if (error instanceof BusinessError) {
                res.status(503).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }


    public static async logout(req: Request, res: Response): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new BusinessError('No token provided', 'INVALID_TOKEN');
            }
            await AuthService.logout(token);
            res.json({ message: 'Logout successful' });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(401).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }

    public static async updatePassword(req: Request, res: Response): Promise<void> {
        try {
            const { email, currentPassword, newPassword } = req.body;
            await AuthService.updatePassword(email, currentPassword, newPassword);
            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(400).json({
                    message: error.message,
                    code: error.code
                });
            }
        }
    }

    public static async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { email, name, companyName } = req.body;
            await AuthService.updateUser(name, companyName, email);
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(400).json({
                    message: error.message,
                    code: error.code
                });
            }
        }
    }

    public static async updateUserNotificationPreferences(req: Request, res: Response): Promise<void> {
        try {
            const { email, notificationPreferences } = req.body;
            await AuthService.updateUserNotificationPreferences(email, notificationPreferences);
            res.json({ message: 'Notification preferences updated successfully' });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(400).json({
                    message: error.message,
                    code: error.code
                });
            }
        }
    }

    public static async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
          const { email } = req.body;
          const { resetToken } = await AuthService.forgotPassword(email);

          // In a real application, you would send this token via email
          // For now, we'll just return it in the response
          // res.json({
          //     message: 'Password reset token generated',
          //     resetToken
          // });
          // email for reset sent
          res.status(200).json({});
        } catch (error) {
            if (error instanceof BusinessError) {
                const status = error.code === 'USER_NOT_FOUND' ? 404 : 400;
                res.status(status).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }

    public static async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, newPassword } = req.body;
            await AuthService.resetPassword(token, newPassword);
            res.json({ message: 'Password reset successful' });
        } catch (error) {
            if (error instanceof BusinessError) {
                res.status(400).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }
}
