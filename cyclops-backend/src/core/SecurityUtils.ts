import {IUser} from "../models/User";
import { Request, Response } from 'express';

export class SecurityUtils {

    public static assertIsAdmin(principal: IUser) {
        if (!principal?.isAdmin) {
            throw new Error("Permission Denied");
        }
    }

    public static assertAdminRequest(req: Request) {
        const principal: IUser = req.principal;
        SecurityUtils.assertIsAdmin(principal);
    }
}