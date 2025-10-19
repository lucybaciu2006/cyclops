import { useLanguage } from '@/contexts/language.context';
import CookieConsent from 'react-cookie-consent';

const CookieBanner = () => {
    const { t } = useLanguage();

    return (
        <CookieConsent
            location="bottom"
            buttonText={t('cookies.accept')}
            declineButtonText={t('cookies.decline')}
            enableDeclineButton
            cookieName="myAppCookieConsent"
            style={{ background: '#2B373B' }}
            buttonStyle={{ backgroundColor: '#f56565', color: 'white' }}
        >
            {t('cookies.message')}
            <a href="/privacy-policy" className="underline ml-2">{t('cookies.learMore')}</a>.
        </CookieConsent>
    );
};

export default CookieBanner;
