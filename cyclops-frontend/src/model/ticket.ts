export interface Ticket {
        userId: string,
        userName: string,
        title: string,
        description: string,
        priority: 'low' | 'medium' | 'high' | 'urgent',
        category: 'technical' | 'billing' | 'feature' | 'general',
        tags: string[],
        status: 'open'
      }