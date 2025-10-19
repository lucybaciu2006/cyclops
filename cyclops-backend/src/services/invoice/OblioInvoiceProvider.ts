import OblioApi from '@obliosoftware/oblioapi';
import { InvoiceProvider, InvoiceCreateResult } from './InvoiceProvider';
import {Utils} from "../../core/Utils";
import {CreateInvoiceData} from "./InvoiceService";
import {CriticalError} from "../../errors/CriticalError";
import {Stripe} from 'stripe';
import errors = module

export class OblioInvoiceProvider implements InvoiceProvider {
    private api: OblioApi;
    private seriesId: string;

    constructor(companyId: string, email: string, secret: string, seriesId: string) {
        Utils.requireNonNulls(companyId);
        Utils.requireNonNulls(email);
        Utils.requireNonNulls(secret);

        this.api = new OblioApi(email, secret);
        this.api.setCif(companyId);
        this.seriesId = seriesId;
        // this.validateSeriesIdExists(seriesId); // will not stop the app startup, but will throw silently
    }

    async validateSeriesIdExists(seriesId: string): Promise<void> {
        let response;
        try {
            response = await this.api.nomenclature('series');
        } catch (err) {
            console.error('Error while validating oblio config');
            throw err;
        }
        const foundSeries = response.data?.find((e: any) => e.name === seriesId);
        if (!foundSeries) {
            throw new CriticalError('Invalid invoice series when initializing Oblio provider');
        }
    }

    async createInvoice(invoiceData: CreateInvoiceData): Promise<InvoiceCreateResult> {
        const date = new Date().toISOString().substring(0, 10);
        const isCompany = !!invoiceData.companyName && !!invoiceData.companyId;
        const apiRequest = {
            // "cif": this.companyId, // added by the library
            "client": {
                "cif": isCompany ? invoiceData.companyId : undefined,
                "name": isCompany ? invoiceData.companyName : invoiceData.fullName,
                // "rc": "J13/887/2017",
                // "code": "oblio",
                "address": invoiceData.address,
                "state": invoiceData.state,
                "city": invoiceData.city,
                "country": invoiceData.country,
                // "iban": "",
                // "bank": "",
                // "email": "",
                // "phone": "",
                // "contact": "",
                // "vatPayer": true
            },
            "issueDate": date,
            // "dueDate": date,
            // "deliveryDate":"2018-10-16",
            "collectDate":date,
            "seriesName": this.seriesId,
            "language": "RO",
            "precision": 2,
            "currency": "RON",
            "products": [
                {
                    "name": invoiceData.productName,
                    // "code": "test",
                    "description": invoiceData.productDescription,
                    "price": invoiceData.productPrice,
                    "measuringUnit": "buc",
                    // "vatName": "Normala",
                    // "vatPercentage": 19,
                    "vatIncluded": 1,
                    "quantity": 1,
                    // "productType": "Serviciu",
                },
                // {
                //     "name": "Discount 10% Test",
                //     "discount": 10,
                //     "discountType": "procentual"
                // }
            ],
            // "issuerName": "Ion Popescu",
            // "issuerId": 1234567890123,
            // "noticeNumber": "AVZ 0041",
            "internalNote": invoiceData.internalNote,
            // "deputyName": "George Popescu",
            // "deputyIdentityCard": "ID 1234",
            // "deputyAuto": "CT 12345",
            // "selesAgent": "Marian Popescu",
            "mentions": invoiceData.mentions,
            // "workStation": "Sediu",

        };
        try {
            const resp = await this.api.createInvoice(apiRequest);
            const data = resp.data;
            const createdInvoice: InvoiceCreateResult = {
                number: data.number,
                series: data.seriesName,
                downloadUrl: data.link
            };
            await this.api.collect(createdInvoice.series, createdInvoice.number, {type: 'Card', documentNumber: createdInvoice.number});
            return createdInvoice;
        } catch (e) {
            console.log('Oblio error', e);
            console.log('Request:', apiRequest);
            throw new CriticalError('OBLIO_REQUEST');
        }

    }

}
