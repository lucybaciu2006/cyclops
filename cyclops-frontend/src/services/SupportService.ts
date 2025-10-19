import { axiosInstance } from "@/lib/axios.config";

export interface ContactMessageRequest {
    name: string;
    email: string;
    subject: string;
    message: string;
}


export class SupportService {
    // public static async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    //     const response = await axiosInstance.post("/create-ticket", data);
    //     return response.data;
    // }

    public static async sendContactMessage(data: ContactMessageRequest): Promise<void> {
        const response = await axiosInstance.post("/public/contact", data);
    }
}