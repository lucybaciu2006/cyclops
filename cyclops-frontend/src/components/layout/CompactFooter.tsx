import React from 'react';
import LanguageSelector from '../LanguageSelector';
import { useLanguage } from '../../contexts/language.context';

const CompactFooter = () => {
    const { t } = useLanguage();

    return (
        <footer className="bg-gray-100 text-gray-700 text-sm p-4 mt-8 border-t border-gray-200">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">{t('footer.about')}</h4>
                    <p>
                        {t('footer.description')}
                    </p>
                    <div className="mt-4">
                        <LanguageSelector />
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">{t('footer.product')}</h4>
                    <ul className="space-y-1">
                        <li><a href="/how-it-works" className="hover:underline">{t('footer.howItWorks')}</a></li>
                        <li><a href="/faq" className="hover:underline">{t('footer.faq')}</a></li>
                        <li><a href="/contact" className="hover:underline">{t('footer.contact')}</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">{t('footer.legal')}</h4>
                    <ul className="space-y-1">
                        <li><a className="hover:underline">{t('footer.terms')}</a></li>
                        <li><a className="hover:underline">{t('footer.privacy')}</a></li>
                        <li><a className="hover:underline">{t('footer.cookies')}</a></li>
                    </ul>
                </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
                {t('footer.copyright')}
            </div>
        </footer>
    );
};

export default CompactFooter;
