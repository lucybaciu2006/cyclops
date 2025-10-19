import {User} from "@/model/user.ts";

export interface LoginResponse {
    message: string;
    user: User;
    token: string;
}