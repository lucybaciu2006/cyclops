export class BusinessError extends Error {
    constructor(
        public code?: string,
        message?: string
    ) {
        super(message);
        this.name = this.constructor.name;
        // This ensures the stack trace is properly captured
        Error.captureStackTrace(this, this.constructor);
    }
}