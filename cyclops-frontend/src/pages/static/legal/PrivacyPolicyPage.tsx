import { useLanguage } from '@/contexts/language.context';

export interface ToSSection {
    title: { en: string; ro: string };
    items: { en: string; ro: string }[];
}

const PrivacyPolicyPage = () => {
    const { language } = useLanguage(); // "en" or "ro"

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">
                {language === 'ro' ? 'Politica de Confidențialitate' : 'Privacy Policy'}
            </h1>

            {items.map((section, index) => (
                <div key={index} className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">
                        {index + 1}. {section.title[language]}
                    </h2>
                    <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                        {section.items.map((item, i) => (
                            <li key={i}>{item[language]}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default PrivacyPolicyPage;

const items: ToSSection[] = [
    {
        title: { en: 'Data Collection', ro: 'Colectarea Datelor' },
        items: [
            {
                en: 'We collect personal information you provide directly, such as your name and email address.',
                ro: 'Colectăm informații personale pe care ni le oferi direct, cum ar fi numele și adresa de email.',
            },
            {
                en: 'We also collect technical data like IP address and device info.',
                ro: 'Colectăm și date tehnice precum adresa IP și informații despre dispozitiv.',
            },
        ],
    },
    {
        title: { en: 'Use of Data', ro: 'Utilizarea Datelor' },
        items: [
            {
                en: 'We use your data to operate, improve, and personalize our platform.',
                ro: 'Folosim datele tale pentru a opera, îmbunătăți și personaliza platforma noastră.',
            },
            {
                en: 'We may use your email for transactional or promotional messages.',
                ro: 'Putem folosi adresa ta de email pentru mesaje tranzacționale sau promoționale.',
            },
        ],
    },
    {
        title: { en: 'Data Retention', ro: 'Păstrarea Datelor' },
        items: [
            {
                en: 'We retain your data as long as your account is active or as needed for legal reasons.',
                ro: 'Păstrăm datele tale cât timp contul este activ sau cât este necesar din punct de vedere legal.',
            },
        ],
    },
    {
        title: { en: 'Your Rights (EU)', ro: 'Drepturile Tale (UE)' },
        items: [
            {
                en: 'If you are an EU resident, you have rights under the GDPR such as data access, correction, and deletion.',
                ro: 'Dacă ești rezident în UE, ai drepturi conform GDPR, cum ar fi accesul, corectarea și ștergerea datelor.',
            },
            {
                en: 'You can withdraw consent at any time.',
                ro: 'Îți poți retrage consimțământul în orice moment.',
            },
        ],
    },
    {
        title: { en: 'Your Rights (US)', ro: 'Drepturile Tale (SUA)' },
        items: [
            {
                en: 'If you are a US resident, you may have rights under laws like the CCPA, such as opting out of data sales.',
                ro: 'Dacă ești rezident în SUA, este posibil să ai drepturi conform legilor precum CCPA, cum ar fi refuzul vânzării datelor.',
            },
        ],
    },
    {
        title: { en: 'Cookies & Tracking', ro: 'Cookies și Urmărire' },
        items: [
            {
                en: 'We use cookies to analyze site usage and improve user experience.',
                ro: 'Folosim cookies pentru a analiza utilizarea site-ului și a îmbunătăți experiența utilizatorului.',
            },
            {
                en: 'You can manage cookie preferences in your browser settings.',
                ro: 'Poți gestiona preferințele pentru cookies din setările browserului.',
            },
        ],
    },
    {
        title: { en: 'Contact', ro: 'Contact' },
        items: [
            {
                en: 'If you have questions, contact us at support@example.com.',
                ro: 'Pentru întrebări, ne poți contacta la support@example.com.',
            },
        ],
    },
];
