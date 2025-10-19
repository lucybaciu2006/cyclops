import {SearchOptions} from "./model/SearchOptions";
import {Request, Response} from 'express';

export class AdminUtils {

    static extractSearchOptions<TFilter = any>(req: Request): SearchOptions<TFilter> {
        const page = parseInt(req.query.page as string || '1', 10);
        const perPage = parseInt(req.query.perPage as string || '10', 10);

        let sort: [string, 'ASC' | 'DESC'] = ['_id', 'ASC'];
        sort = JSON.parse(req.query.sort as string || '["_id", "ASC"]');

        let filter: TFilter = {} as TFilter;
        filter = JSON.parse(req.query.filter as string || '{}');

        return {page, perPage, sort, filter};
    }
}