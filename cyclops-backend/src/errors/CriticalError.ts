export class CriticalError extends Error {
    constructor(
        message: string,
        public readonly code: string = 'CRITICAL_ERROR'
    ) {
        super(message);
        this.name = 'CriticalError';
    }
} 