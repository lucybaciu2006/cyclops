import {Request, Response} from 'express';
import {CreateTicketRequest, TicketListOptions, TicketService} from '../services/TicketService';
import {IUser} from '../models/User';
import {BusinessError} from '../errors/BusinessError';
import {Utils} from "../core/Utils";
import {AdminNotificationEvent, NotificationService} from "../services/NotificationService";
import {MailService} from "../services/MailService";

export interface ContactMessageRequest {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export class SupportController {

    public static async handleContactMessage(req: Request, res: Response): Promise<void> {
        try {
            const request: ContactMessageRequest = req.body;

            // Validate required fields
            if (Utils.someIsNull(request.name, request.email, request.subject, request.message)) {
                res.status(400).json({ 
                    error: 'Title and description are required',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
                return;
            }

            const ticketRequest: CreateTicketRequest = {
                email: request.email,
                title: request.subject,
                description: request.message,
                category: 'general',
                priority: 'medium',
            };

            const ticket = await TicketService.createTicket(ticketRequest);
            MailService.sendContactUsResponseEmail(request.email);
            // send async
            NotificationService.notifyAdmins(AdminNotificationEvent.CONTACT_MESSAGE_RECEIVED, {email: request.email, message: request.message, subject: request.subject})
            res.status(201).send();
        } catch (error) {
            console.error('Error creating ticket:', error);
            if (error instanceof BusinessError) {
                res.status(503).json({
                    message: error.message,
                    code: error.code
                });
            } else {
                res.status(500).json({
                    message: error instanceof Error ? error.message : 'An error occurred',
                    code: 'INTERNAL_SERVER_ERROR'
                });
            }
        }
    }

    public static async getUserTickets(req: Request, res: Response): Promise<void> {
        try {
            const principal: IUser = req.principal;
            
            const options: TicketListOptions = {
                page: parseInt(req.query.page as string) || 1,
                perPage: parseInt(req.query.perPage as string) || 10,
                status: req.query.status as string,
                priority: req.query.priority as string,
                category: req.query.category as string,
                search: req.query.search as string,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
            };

            const result = await TicketService.getUserTickets(principal._id?.toString() || '', options);
            res.json(result);
        } catch (error) {
            console.error('Error fetching user tickets:', error);
            res.status(500).json({
                message: error instanceof Error ? error.message : 'An error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    public static async getTicketById(req: Request, res: Response): Promise<void> {
        try {
            const principal: IUser = req.principal;
            const ticketId = req.params.id;

            const ticket = await TicketService.getTicketById(ticketId, principal._id?.toString() || '');
            
            if (!ticket) {
                res.status(404).json({
                    error: 'Ticket not found',
                    code: 'TICKET_NOT_FOUND'
                });
                return;
            }

            res.json(ticket);
        } catch (error) {
            console.error('Error fetching ticket:', error);
            res.status(500).json({
                message: error instanceof Error ? error.message : 'An error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    public static async updateTicket(req: Request, res: Response): Promise<void> {
        try {
            const principal: IUser = req.principal;
            const ticketId = req.params.id;
            const updates = req.body;

            const ticket = await TicketService.updateTicket(ticketId, principal._id?.toString() || '', updates);
            
            if (!ticket) {
                res.status(404).json({
                    error: 'Ticket not found',
                    code: 'TICKET_NOT_FOUND'
                });
                return;
            }

            res.json(ticket);
        } catch (error) {
            console.error('Error updating ticket:', error);
            res.status(500).json({
                message: error instanceof Error ? error.message : 'An error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    public static async updateTicketStatus(req: Request, res: Response): Promise<void> {
        try {
            const principal: IUser = req.principal;
            const ticketId = req.params.id;
            const { status } = req.body;

            if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
                res.status(400).json({
                    error: 'Valid status is required',
                    code: 'INVALID_STATUS'
                });
                return;
            }

            const ticket = await TicketService.updateTicketStatus(ticketId, principal._id?.toString() || '', status);
            
            if (!ticket) {
                res.status(404).json({
                    error: 'Ticket not found',
                    code: 'TICKET_NOT_FOUND'
                });
                return;
            }

            res.json(ticket);
        } catch (error) {
            console.error('Error updating ticket status:', error);
            res.status(500).json({
                message: error instanceof Error ? error.message : 'An error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    public static async deleteTicket(req: Request, res: Response): Promise<void> {
        try {
            const principal: IUser = req.principal;
            const ticketId = req.params.id;

            const deleted = await TicketService.deleteTicket(ticketId, principal._id?.toString() || '');
            
            if (!deleted) {
                res.status(404).json({
                    error: 'Ticket not found',
                    code: 'TICKET_NOT_FOUND'
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            res.status(500).json({
                message: error instanceof Error ? error.message : 'An error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
}