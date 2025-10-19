import { InvoiceProvider, InvoiceCreateResult } from './InvoiceProvider';
import {OblioInvoiceProvider} from "./OblioInvoiceProvider";
import {env} from "../../config/env";

export interface CreateInvoiceData {
    companyName?: string;
    companyId?: string; // cui

    fullName: string;
    city: string;
    country: string;
    address: string;
    postalCode?: string;
    state: string;

    productName: string;
    productDescription?: string;
    productPrice: number;
    mentions?: string;
    internalNote?: string;
}

export class InvoiceService {
    static provider: InvoiceProvider = new OblioInvoiceProvider(env.OBLIO_CUI, env.OBLIO_EMAIL, env.OBLIO_SECRET, env.OBLIO_INVOICE_SERIES);

    static createInvoice(invoiceData: CreateInvoiceData): Promise<InvoiceCreateResult> {
        return this.provider.createInvoice(invoiceData);
    }

}
