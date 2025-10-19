import { User, IUser } from '../models/User';
import { EmailConfirmToken } from '../models/EmailConfirmToken';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BusinessError } from '../errors/BusinessError';
import { CriticalError } from '../errors/CriticalError';
import { MailService } from './MailService';
import {ConfigFile} from "../config/ConfigFile";
import { ResetPasswordToken } from "../models/ResetPasswordToken";
import {OAuth2Client} from "google-auth-library";
import {ExternalUserProfile} from "../models/user/ExternalUserProfile";
import { NotificationSettings } from '../core/NotificationTypes';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const JWT_SECRET = process.env.JWT_SECRET!;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export class AuthService {
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    private static readonly TOKEN_EXPIRY = '24h';

    public static async register(userData: {
        email: string;
        password: string;
        name: string;
        anonymous?: boolean;
    }): Promise<{ user: IUser; confirmToken: string }> {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new BusinessError('Email already registered', 'EMAIL_ALREADY_REGISTERED');
        }

        const user = new User({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            emailConfirmed: false,
            isAnonymous: userData.anonymous
        });
        await user.save();

        // Generate email confirmation token
        const token = crypto.randomBytes(32).toString('hex');
        const confirmToken = new EmailConfirmToken({
            userId: user._id,
            token: token,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
        });
        await confirmToken.save();
        console.log('sending email');
        await MailService.sendConfirmEmail(userData.email, userData.name, confirmToken.token);
        console.log('email sent');
        // Send confirmation email
        return { user, confirmToken: token };
    }

    public static async loginWithExternalProvider(provider: string, token: string) {
        const externalProviderHandler = providerHandlers[provider as keyof typeof providerHandlers];
        if (!externalProviderHandler) throw new BusinessError('Unsupported provider', 'UNSUPPORTED_PROVIDER');

        const externalProfile = await externalProviderHandler(token);

        // Try to find by external ID
        const externalIdField = `${provider}Profile.id`;
        let user: IUser = await User.findOne({ [externalIdField]: externalProfile.id });

        if (!user) {
            // Fallback: try finding by email
            user = await User.findOne({ email: externalProfile.email });

            if (user) {
                // Link provider to existing user
                user[`${provider}Profile`] = externalProfile;
                user.emailConfirmed = true;
            } else {
                // Create new user
                user = new User({
                    email: externalProfile.email,
                    password: crypto.randomBytes(20).toString('hex'),
                    name: externalProfile.name,
                    emailConfirmed: true,
                    trialSecondsLeft: ConfigFile.USER_TRIAL_SECONDS,
                    [`${provider}Profile`]: externalProfile
                });
            }

            await user.save();
            // TODO: maybe send welcome email
        }

        return this.authenticate(user);
    }

    public static async deleteUser(email: string, password: string): Promise<void> {
        const user = await User.findOne({ email });
        if (!user) {
            throw new BusinessError('User not found', 'USER_NOT_FOUND');
        }
        const isMatch = await user!.comparePassword(password);
        if (!isMatch) {
            throw new BusinessError('Invalid credentials', 'INVALID_CREDENTIALS');
        }
        await user.deleteOne();
    }

    public static async confirmEmail(token: string): Promise<void> {
        const confirmToken = await EmailConfirmToken.findOne({ token });
        if (!confirmToken) {
            throw new BusinessError('Invalid or expired confirmation token', 'INVALID_TOKEN');
        }

        const user = await User.findById(confirmToken.userId);
        if (!user) {
            throw new CriticalError('User not found', 'USER_NOT_FOUND');
        }

        user.emailConfirmed = true;
        await user.save();

        // Delete the used token
        await EmailConfirmToken.deleteOne({ _id: confirmToken._id });
    }

    public static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
        const user = await User.findOne({ email });
        if (!user) {
            throw new BusinessError('Invalid credentials', 'EMAIL_NOT_EXISTING');
        }

        // if (!user!.emailConfirmed) { // TODO
        //     throw new BusinessError('Please confirm your email first', 'EMAIL_NOT_CONFIRMED');
        // }

        // const isMatch = await user!.comparePassword(password); // TODO
        // if (!isMatch) {
        //     throw new BusinessError('Invalid credentials', 'INVALID_CREDENTIALS');
        // }

        return this.authenticate(user);
    }

    public static authenticate(user: IUser): { user: IUser; token: string } {

        const token = jwt.sign(
            { userId: user._id },
            this.JWT_SECRET,
            { expiresIn: this.TOKEN_EXPIRY }
        );

    return { user, token };
  }

  public static async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new BusinessError("User not found", "USER_NOT_FOUND");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetPasswordToken = new ResetPasswordToken({
      userId: user._id,
      token: resetToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    await resetPasswordToken.save();
    await MailService.sendResetPasswordEmail(user.email, user.name, resetPasswordToken.token);
    // Send confirmation email

    return { resetToken };
  }

  public static async resetPassword(token: string, newPassword: string): Promise<void> {

    const resetPasswordTokenObj = await ResetPasswordToken.findOne({ token });
    if (!resetPasswordTokenObj) {
      throw new BusinessError("Invalid or expired reset token", "INVALID_TOKEN");
    }

    const user = await User.findById(resetPasswordTokenObj.userId);
    if (!user) {
      throw new BusinessError("Invalid or expired reset token", "INVALID_TOKEN");
    }

    if (!newPassword || newPassword.trim().length === 0) {
        throw new BusinessError('New password is required', 'PASSWORD_REQUIRED');
    }
    user.password = newPassword;
    try {
        await user.save();
        await ResetPasswordToken.deleteOne({ _id: resetPasswordTokenObj._id });
    } catch (error) {
        throw error;
    }
  }

  public static async updatePassword(email: string,currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new BusinessError("User not found", "USER_NOT_FOUND");
    }

    const isMatch = await user!.comparePassword(currentPassword);
    if (!isMatch) {
      console.log('Invalid credentials');
      throw new BusinessError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    if (!newPassword || newPassword.trim().length === 0) {
        throw new BusinessError('New password is required', 'PASSWORD_REQUIRED');
    }
    user.password = newPassword;
    try {
        await user.save();
    } catch (error) {
        throw error;
    }
  }

  public static async updateUser(name: string, companyName: string, email: string): Promise<void> {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new BusinessError("User not found", "USER_NOT_FOUND");
    }
    user.name = name;
    user.companyName = companyName;
    await user.save();
  }

    public static async updateUserNotificationPreferences(email: string, notificationPreferences: NotificationSettings): Promise<void> {
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new BusinessError("User not found", "USER_NOT_FOUND");
        }
        user.notifications = notificationPreferences;
        await user.save();
    }

    public static async logout(token: string): Promise<void> {
        try {
            jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new BusinessError('Invalid token', 'INVALID_TOKEN');
        }
    }
}

const providerHandlers = {
    google: async (token: string): Promise<ExternalUserProfile> => {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload?.email) throw new BusinessError('Invalid Google token', 'INVALID_TOKEN');

        return {
            email: payload.email,
            name: payload.name || '',
            id: payload.sub,
            picture: payload.picture
        };
    },

    facebook: async (token: string): Promise<ExternalUserProfile> => {
        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
        if (!response.ok) throw new BusinessError('Failed to fetch user from Facebook', 'FACEBOOK_API_ERROR');

        const data = await response.json();
        if (!data.email) throw new BusinessError('Email permission required from Facebook', 'NO_EMAIL');

        return {
            email: data.email,
            name: data.name,
            id: data.id,
            picture: data.picture?.data?.url
        };
    }
}