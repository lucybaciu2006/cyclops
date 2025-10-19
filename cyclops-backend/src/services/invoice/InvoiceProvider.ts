import {CreateInvoiceData} from "./InvoiceService";

export interface InvoiceCreateResult {
    series: string;
    number: number;
    downloadUrl: string;
}

export interface InvoiceProvider {
    createInvoice(invoiceData: CreateInvoiceData): Promise<InvoiceCreateResult>;
    // getInvoice(reference: string): Promise<any>;
}