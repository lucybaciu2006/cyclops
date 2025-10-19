export interface StoredFile {
    id: string;
    filename: string;
    url: string;
    metadata?: Record<string, any>;
    createdOn?: number;

}
