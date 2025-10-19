import { User, IUser } from '../../models/User';
import {SearchOptions} from "../../controllers/admin/model/SearchOptions";
import {UserListFilters} from "../../controllers/admin/AdminUsersController";

export interface UserListResponse {
    id: string;
    email: string;
    name: string;
    propertiesCount: number;
    trialSecondsLeft: number;
    creditsConsumed: number;
    webSessionSeconds: number;
    isActive: boolean;
    createdAt: string;
}

export interface UserListResult {
    users: UserListResponse[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        pages: number;
    };
}

export class AdminUsersService {

    static async countUsers(options: SearchOptions<UserListFilters>): Promise<number> {
        const searchFilter: any = {};
        const { filter } = options;
        
        if (filter?.search) {
            searchFilter['$or'] = [
                { name: { $regex: filter.search, $options: 'i' } },
                { email: { $regex: filter.search, $options: 'i' } }
            ];
        }
        
        if (filter?.isActive !== undefined) {
            searchFilter.isActive = filter.isActive;
        }
        
        console.log(searchFilter);
        return User.countDocuments(searchFilter);
    }

    static async listUsers(options: SearchOptions<UserListFilters>): Promise<UserListResult> {
        const { page, perPage, sort, filter } = options;
        const skip = (page - 1) * perPage;

        const matchStage: any = {};

        if (filter?.search) {
            matchStage['$or'] = [
                { name: { $regex: filter.search, $options: 'i' } },
                { email: { $regex: filter.search, $options: 'i' } }
            ];
        }

        if (filter?.isActive !== undefined) {
            matchStage.isActive = filter.isActive;
        }

        const response = await User.aggregate([
            { "$addFields": { "id": { "$toString": "$_id" }}}, // string can't match ObjectId types
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
            {
                $lookup: {
                    from: 'properties',
                    localField: 'id',
                    foreignField: 'userId',
                    as: 'properties'
                }
            },
            {
                $addFields: {
                    propertiesCount: { $size: '$properties' },
                    creditsConsumed: {
                        $reduce: {
                            input: '$properties',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.creditsConsumed', 0] }] }
                        }
                    }
                }
            },
            {
                $project: {
                    id: 1,
                    email: 1,
                    name: 1,
                    propertiesCount: 1,
                    trialSecondsLeft: 1,
                    webSessionSeconds: 1,
                    creditsConsumed: 1,
                    isActive: 1,
                    createdAt: 1
                    // properties field will be excluded automatically
                }
            },
            { $sort: { [sort[0]]: sort[1] === 'ASC' ? 1: -1 } },
            { $skip: skip },
            { $limit: perPage },
        ]);
        
        return response as unknown as UserListResult;
    }

    static async getUserById(userId: string): Promise<IUser | null> {
        return User.findById(userId).select('-password');
    }

    static async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
    }

    static async deleteUser(userId: string): Promise<IUser | null> {
        return User.findByIdAndDelete(userId);
    }
} 