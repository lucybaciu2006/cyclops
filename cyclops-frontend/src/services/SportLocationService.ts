import { axiosInstance } from "@/lib/axios.config";
import {SportLocation} from "@/model/sport-location.ts";

export class SportLocationService {

    public static async getBySlug(slang: string): Promise<SportLocation> {
        const response = await axiosInstance.get<SportLocation>(`/public/location-by-slang/${slang}`);
        return response.data;
    }

}
