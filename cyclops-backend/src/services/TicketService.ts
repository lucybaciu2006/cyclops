import { TicketListFilters } from '../controllers/admin/AdminTicketsController';
import { SearchOptions } from '../controllers/admin/model/SearchOptions';
import { ITicket, Ticket } from '../models/Ticket';

export interface CreateTicketRequest {
    email: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
}

export interface TicketListOptions {
    page?: number;
    perPage?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class TicketService {

    public static async createTicket(request: CreateTicketRequest): Promise<ITicket> {
        const ticket = await Ticket.create({
            email: request.email,
            title: request.title,
            description: request.description,
            priority: request.priority,
            category: request.category,
            status: 'open'
        });

        return ticket;
    }

    public static async getUserTickets(userId: string, options: TicketListOptions = {}): Promise<{ tickets: ITicket[], total: number }> {
        const page = options.page || 1;
        const perPage = options.perPage || 10;
        const skip = (page - 1) * perPage;
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

        // Build query
        let query: any = { userId };
        
        if (options.status) {
            query.status = options.status;
        }
        if (options.priority) {
            query.priority = options.priority;
        }
        if (options.category) {
            query.category = options.category;
        }
        if (options.search) {
            query.$or = [
                { title: { $regex: options.search, $options: 'i' } },
                { description: { $regex: options.search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(perPage);

        const total = await Ticket.countDocuments(query);

        return { tickets, total };
    }

    public static async getTicketById(ticketId: string, userId: string): Promise<ITicket | null> {
        return Ticket.findOne({ _id: ticketId, userId });
    }

    public static async updateTicket(ticketId: string, userId: string, updates: Partial<ITicket>): Promise<ITicket | null> {
        const allowedFields = ['title', 'description', 'priority', 'category', 'tags'];
        
        const updatePayload: Partial<ITicket> = {};
        for (const field of allowedFields) {
            if (updates[field as keyof ITicket] != null) {
                updatePayload[field as keyof ITicket] = updates[field as keyof ITicket]!;
            }
        }

        return Ticket.findOneAndUpdate(
            { _id: ticketId, userId },
            { $set: updatePayload },
            { new: true }
        );
    }

    public static async updateTicketStatus(ticketId: string, userId: string, status: ITicket['status']): Promise<ITicket | null> {
        const updatePayload: Partial<ITicket> = { status };
        
        if (status === 'resolved' || status === 'closed') {
            updatePayload.resolvedAt = new Date();
        }

        return Ticket.findOneAndUpdate(
            { _id: ticketId, userId },
            { $set: updatePayload },
            { new: true }
        );
    }

    public static async deleteTicket(ticketId: string, userId: string): Promise<boolean> {
        const result = await Ticket.deleteOne({ _id: ticketId, userId });
        return result.deletedCount > 0;
    }

    public static async countTickets(options: SearchOptions<TicketListFilters>): Promise<number> {
        const searchFilter: any = {};
        const searchValue = options.filter?.search;
        if (searchValue) {
            searchFilter.$or = [
                { title: { $regex: searchValue, $options: 'i' } },
                { description: { $regex: searchValue, $options: 'i' } }
            ];
        }
        return Ticket.countDocuments(searchFilter);
    }

    public static async getAllTickets(options: SearchOptions<TicketListFilters>): Promise<ITicket[]> {
        const { page, perPage, sort, filter } = options;
        const skip = (page - 1) * perPage;

        const matchStage: any = {};

        if (filter?.search) {
            matchStage['$or'] = [
                { title: { $regex: filter.search, $options: 'i' } },
                { description: { $regex: filter.search, $options: 'i' } }
            ];
        }
        
        if (filter?.status) {
            matchStage.status = filter.status;
        }
        if (filter?.priority) {
            matchStage.priority = filter.priority;
        }
        if (filter?.category) {
            matchStage.category = filter.category;
        }

        const tickets = await Ticket.aggregate([
            { "$addFields": { "id": { "$toString": "$_id" }}}, // string can't match ObjectId types
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$userId' },
                    pipeline: [
                        {
                            $addFields: {
                                stringId: { $toString: '$_id' }
                            }
                        },
                        {
                            $match: {
                                $expr: { $eq: ['$stringId', '$$userId'] }
                            }
                        }
                    ],
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    userName: '$user.name',
                    userEmail: '$user.email'
                }
            },
            {
                $project: {
                    id: 1,
                    title: 1,
                    description: 1,
                    priority: 1,
                    status: 1,
                    category: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userId: 1,
                    userName: 1,
                    userEmail: 1,
                    assignedTo: 1
                }
            },
            { $sort: { [sort[0]]: sort[1] === 'ASC' ? 1: -1 } },
            { $skip: skip },
            { $limit: perPage },
        ]);

        return tickets as unknown as ITicket[];
    }

    public static async getTicketByIdAdmin(ticketId: string): Promise<ITicket | null> {
        return Ticket.findById(ticketId)
            .populate('userId', 'name email')
            .populate('assignedTo', 'name email');
    }

    public static async assignTicket(ticketId: string, assignedToUserId: string): Promise<ITicket | null> {
        return Ticket.findByIdAndUpdate(
            ticketId,
            { 
                $set: { 
                    assignedTo: assignedToUserId,
                    status: 'in_progress'
                }
            },
            { new: true }
        ).populate('userId', 'name email companyName')
         .populate('assignedTo', 'name email');
    }

    public static async updateTicketAdmin(ticketId: string, updates: Partial<ITicket>): Promise<ITicket | null> {
        const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'assignedTo', 'tags'];
        
        const updatePayload: Partial<ITicket> = {};
        for (const field of allowedFields) {
            if (updates[field as keyof ITicket] != null) {
                updatePayload[field as keyof ITicket] = updates[field as keyof ITicket]!;
            }
        }

        // Set resolvedAt when status changes to resolved
        if (updates.status && updates.status === 'resolved' as ITicket['status']) {
            updatePayload.resolvedAt = new Date();
        } else if (updates.status && updates.status !== 'resolved' as ITicket['status']) {
            updatePayload.resolvedAt = undefined;
        }

        return Ticket.findByIdAndUpdate(
            ticketId,
            { $set: updatePayload },
            { new: true, runValidators: true }
        ).populate('userId', 'name email companyName')
         .populate('assignedTo', 'name email');
    }

    public static async deleteTicketAdmin(ticketId: string): Promise<boolean> {
        const result = await Ticket.findByIdAndDelete(ticketId);
        return result !== null;
    }
} 