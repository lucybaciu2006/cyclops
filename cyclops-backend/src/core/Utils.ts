export class Utils {
    static requireNonNulls(...values: any[]): void {
        for (let i = 0; i < values.length; i++) {
            if (values[i] === null || values[i] === undefined) {
                throw new Error(`Value at index ${i} must not be null or undefined`);
            }
        }
    }

    static someIsNull(...values: any[]): boolean {
        for (let i = 0; i < values.length; i++) {
            if (values[i] === '' || values[i] === null || values[i] === undefined) {
                return true;
            }
        }
        return false;
    }

}
