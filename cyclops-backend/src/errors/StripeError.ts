export class StripeError extends Error {
    constructor(
        message: string,
        public readonly code: string = 'STRIPE_ERROR'
    ) {
        super(message);
        this.name = 'STRIPE_ERROR';
    }
}