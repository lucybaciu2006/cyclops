import { Request, Response } from 'express';
import { IUser } from '../../models/User';
import { SecurityUtils } from '../../core/SecurityUtils';
import { AdminUsersService } from '../../services/admin/AdminUsersService';
import {AdminUtils} from "./AdminUtils";
import {SearchOptions} from "./model/SearchOptions";

export interface UserListFilters {
    search?: string;
    isActive?: boolean;
}

export class AdminUsersController {

    static async list(req: Request, res: Response) {
        try {
            const options: SearchOptions<UserListFilters> = AdminUtils.extractSearchOptions<UserListFilters>(req);

            const result = await AdminUsersService.listUsers(options);
            const count = await AdminUsersService.countUsers(options);
            res.setHeader('Content-Range', count);
            console.log("users", result);
            res.json(result);
        } catch (error: any) {
            console.log("error", error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const user = await AdminUsersService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const { name, email, companyName, isAdmin, emailConfirmed, trialSecondsLeft } = req.body;

            // Don't allow updating password through this endpoint for security
            const updateData: Partial<IUser> = {};
            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;
            if (companyName !== undefined) updateData.companyName = companyName;
            if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
            if (emailConfirmed !== undefined) updateData.emailConfirmed = emailConfirmed;
            if (trialSecondsLeft !== undefined) updateData.trialSecondsLeft = trialSecondsLeft;

            const user = await AdminUsersService.updateUser(req.params.id, updateData);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const user = await AdminUsersService.deleteUser(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
} 