import { Request, Response } from 'express';
import { ITicket } from '../../models/Ticket';
import { SecurityUtils } from '../../core/SecurityUtils';
import { TicketService, TicketListOptions } from '../../services/TicketService';
import { SearchOptions } from './model/SearchOptions';
import { AdminUtils } from './AdminUtils';

export interface TicketListFilters {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
}

export class AdminTicketsController {

    static async list(req: Request, res: Response) {
        try {
            const options: SearchOptions<TicketListFilters> = AdminUtils.extractSearchOptions<TicketListFilters>(req);

            const result = await TicketService.getAllTickets(options);
            const count = await TicketService.countTickets(options);
            res.setHeader('Content-Range', count);
            console.log("tickets", result);
            res.json(result);
        } catch (error: any) {
            console.log("error", error);
            res.status(500).json({ error: error.message });
        }
    }



    static async getById(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const ticket = await TicketService.getTicketByIdAdmin(req.params.id);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            res.json(ticket);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const {
                title,
                description,
                status,
                priority,
                category,
                assignedTo,
            } = req.body;

            const updateData: Partial<ITicket> = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (status !== undefined) updateData.status = status;
            if (priority !== undefined) updateData.priority = priority;
            if (category !== undefined) updateData.category = category;
            if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

            const ticket = await TicketService.updateTicketAdmin(req.params.id, updateData);

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            res.json(ticket);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const deleted = await TicketService.deleteTicketAdmin(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async assign(req: Request, res: Response) {
        try {
            SecurityUtils.assertAdminRequest(req);

            const { assignedTo } = req.body;
            if (!assignedTo) {
                return res.status(400).json({ error: 'assignedTo is required' });
            }

            const ticket = await TicketService.assignTicket(req.params.id, assignedTo);
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            res.json(ticket);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
} 