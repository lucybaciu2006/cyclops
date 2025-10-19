export interface TranslationItem {
    en: string;
    ro: string;
}

export const i18n: Record<string, TranslationItem> = {
    'checkout.companyName': {en: 'Company Name', ro: 'Nume Companie'},
    'checkout.companyId': {en: 'Company ID', ro: 'CUI (RO12345678)'},
}

export const Translate = (key: string, locale: string) => {
    let record: TranslationItem = i18n[key];
    if (!record) {
        return '';
    }
    return record[locale as ('en' | 'ro') || 'en'];
}