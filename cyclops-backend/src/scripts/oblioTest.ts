// testInvoice.ts

import dotenv from 'dotenv';
import {env} from "../config/env";
import OblioApi from "@obliosoftware/oblioapi";
import {CreateInvoiceData} from "../services/invoice/InvoiceService";
import {OblioInvoiceProvider} from "../services/invoice/OblioInvoiceProvider";


const api = new OblioApi(env.OBLIO_EMAIL, env.OBLIO_SECRET);
api.setCif('RO40618680');
const invoiceData: CreateInvoiceData = {
    city: 'Cluj-Napoca',
    companyName: 'some company',
    companyId: '43139828',
    address: 'Strada Plevnei 97',
    state: 'Cluj',
    country: 'Romania',
    mentions: 'mentiuni',
    fullName: 'Lucian Baciu',
    // productDescription: 'Subscriptie AGENT AI',
    productName: 'Subscriptie Agent AI',
    productPrice: 199,
    internalNote: 'Transactie generata din oblioTest.ts',

};
const oblio = new OblioInvoiceProvider(env.OBLIO_CUI, env.OBLIO_EMAIL, env.OBLIO_SECRET, env.OBLIO_INVOICE_SERIES);
(async () => {
    try {
        await oblio.createInvoice(invoiceData);
    } catch (e) {
        console.log(e);
    }
})();
