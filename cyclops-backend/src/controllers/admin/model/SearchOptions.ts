export interface SearchOptions<TFilter = any> {
    page: number;
    perPage: number;
    sort: [key: string, direction: 'ASC' | 'DESC'];
    filter?: TFilter;
}