// ObjectValidator.ts
import { z } from "zod";
import {ValidationIssue} from "./ValidationIssue";
import {ValidationError} from "./ValidationError";

export class ObjectValidator<S extends z.ZodRawShape> {
    readonly schema: z.ZodObject<S>;

    constructor(shape: S) {
        // add .strict() if you want to forbid extra props
        this.schema = z.object(shape);
    }

    /** Zod-style safeParse; returns discriminated union with typed data */
    safeParse(data: unknown) {
        return this.schema.safeParse(data);
    }

    /** Throws ZodError on failure; returns strongly typed data on success */
    parse(data: unknown): z.infer<z.ZodObject<S>> {
        return this.schema.parse(data);
    }

    /** Void convenience: throws ValidationException on failure */
    validate(data: unknown): void {
        const r = this.schema.safeParse(data);
        if (!r.success) {
            const issues: ValidationIssue[] = r.error.issues.map(i => ({
                path: i.path.join("."),
                code: i.code,
                message: i.message,
            }));
            throw new ValidationError('Validation errors', issues);
        }
        // success → no-op
    }
}
