import {SearchOptions} from "../../controllers/admin/model/SearchOptions";
import {ISportLocation, SportLocation} from "../../models/location/SportLocation";

export interface PlayAreaListResponse {
    id: string;
    name: string;
    imageUrl?: string;
    address: string;
    coordinates: { lat: number; lng: number };
    createdAt: string;
}

export interface PlayAreaListFilters {
    search?: string;
}

export interface PlayAreaListOptions {
    page: number;
    perPage: number;
    sort: string;
    filter?: PlayAreaListFilters;
}

export interface PlayAreaListResult {
    playAreas: PlayAreaListResponse[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        pages: number;
    };
}

export class AdminPlayAreasService {

    static async countPlayAreas(options: SearchOptions<PlayAreaListFilters>): Promise<number> {
        const { filter } = options;
        const matchStage: any = {};

        if (filter?.search) {
            matchStage['$or'] = [
                { name: { $regex: filter.search, $options: 'i' } },
                { address: { $regex: filter.search, $options: 'i' } }
            ];
        }

        return SportLocation.countDocuments(matchStage);
    }

    static async listPlayAreas(options: SearchOptions<PlayAreaListFilters>): Promise<PlayAreaListResult> {
        const { page, perPage, sort, filter } = options;
        const skip = (page - 1) * perPage;

        const matchStage: any = {};

        if (filter?.search) {
            matchStage['$or'] = [
                { name: { $regex: filter.search, $options: 'i' } },
                { address: { $regex: filter.search, $options: 'i' } }
            ];
        }

        const playAreas = await SportLocation.aggregate([
            { $addFields: { id: { $toString: '$_id' } } },
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $project: {
                    id: 1,
                    name: 1,
                    address: 1,
                    imageUrl: '$image.url',
                    coordinates: 1,
                    createdAt: 1
                }
            },
            { $sort: { [sort[0]]: sort[1] === 'ASC' ? 1 : -1 } },
            { $skip: skip },
            { $limit: perPage }
        ]);

        const total = await SportLocation.countDocuments(matchStage);

        return {
            playAreas: playAreas as unknown as PlayAreaListResponse[],
            pagination: {
                page,
                perPage,
                total,
                pages: Math.ceil(total / perPage)
            }
        };
    }

    static async getPlayAreaById(id: string): Promise<ISportLocation | null> {
        return SportLocation.findById(id);
    }

    static async updatePlayArea(id: string, updateData: Partial<ISportLocation>): Promise<ISportLocation | null> {
        return SportLocation.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    }

    static async deletePlayArea(id: string): Promise<ISportLocation | null> {
        return SportLocation.findByIdAndDelete(id);
    }
}
