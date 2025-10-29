"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translate = exports.i18n = void 0;
exports.i18n = {
    'checkout.companyName': { en: 'Company Name', ro: 'Nume Companie' },
    'checkout.companyId': { en: 'Company ID', ro: 'CUI (RO12345678)' },
};
const Translate = (key, locale) => {
    let record = exports.i18n[key];
    if (!record) {
        return '';
    }
    return record[locale || 'en'];
};
exports.Translate = Translate;
