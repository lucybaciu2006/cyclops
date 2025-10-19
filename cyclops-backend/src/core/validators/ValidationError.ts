import {ValidationIssue} from "./ValidationIssue";

export class ValidationError extends Error {

    issues: ValidationIssue[] = [];

    constructor(message?: string, issues?: ValidationIssue[]) {
        super(message);
        this.issues = issues || [];
    }


}