export enum NotificationList {
    CALL_MADE = 'CALL_MADE',
    CALL_RECEIVED = 'CALL_RECEIVED',
    NEW_USER_CREATED = 'NEW_USER_CREATED',
    NEW_PAYMENT_CREATED = 'NEW_PAYMENT_CREATED',
    NEW_PAYMENT_FAILED = 'NEW_PAYMENT_FAILED',
    SCRAPER_ERROR = 'SCRAPER_ERROR',
}

export interface NotificationSettings {
    callNotification: boolean;
    billingNotification: boolean;
    marketingNotification: boolean;
    language:string;
}
