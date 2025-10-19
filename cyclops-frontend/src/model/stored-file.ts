export interface StoredFile {
    id: string;
    filename: string;
    url: string;
    metadata: string;
    properties: Record<string, any>;
    createdOn: number;
}
