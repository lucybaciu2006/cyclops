import {SearchOptions} from "../controllers/admin/model/SearchOptions";
import {InvitationListFilters} from "../controllers/admin/AdminInvitationsController";
import {IInvitationCode, InvitationCode} from "../models/InvitationCode";

export class InvitationCodesService {

    static async count(options: SearchOptions<InvitationListFilters>): Promise<number> {
        const searchFilter: any = {};
        const searchValue = options.filter?.search;
        if (searchValue) {
            searchFilter['$or'] = [
                {name: {$regex: searchValue, $options: 'i'}},
                {email: {$regex: searchValue, $options: 'i'}}
            ];
        }
        return InvitationCode.countDocuments(searchFilter);
    }

    static async list(options: SearchOptions<InvitationListFilters>): Promise<IInvitationCode[]> {
        const {page, perPage, sort, filter} = options;
        const skip = (page - 1) * perPage;

        const matchStage: any = {};

        if (filter?.search) {
            matchStage['$or'] = [
                {name: {$regex: filter.search, $options: 'i'}},
                {email: {$regex: filter.search, $options: 'i'}}
            ];
        }

        const response = await InvitationCode.aggregate([
            {"$addFields": {"id": {"$toString": "$_id"}}}, // string can't match ObjectId types
            ...(Object.keys(matchStage).length > 0 ? [{$match: matchStage}] : []),
            // {
            //     $lookup: {
            //         from: 'properties',
            //         localField: 'id',
            //         foreignField: 'userId',
            //         as: 'properties'
            //     }
            // },
            // {
            //     $addFields: {
            //         propertyCount: {$size: '$properties'}
            //     }
            // },
            // {
            //     $project: {
            //         properties: 0 // exclude full array if not needed
            //     }
            // },
            {$sort: {[sort[0]]: sort[1] === 'ASC' ? 1 : -1}},
            {$skip: skip},
            {$limit: perPage},
        ]);
        return response;
    }
}