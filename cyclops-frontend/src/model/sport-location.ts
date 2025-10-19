import { SportType } from "./sport-type";
import { StoredFile } from "./stored-file";

export interface SportLocation {
    _id: string;
    name: string;
    slug: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    image?: StoredFile;
    sport: SportType;
}