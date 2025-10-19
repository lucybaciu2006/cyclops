import { useLanguage } from '@/contexts/language.context';

export interface ToSSection {
    title: { en: string; ro: string };
    items: { en: string; ro: string }[];
}

const cookiePolicyItems: ToSSection[] = [
    {
        title: {
            en: "What Are Cookies?",
            ro: "Ce Sunt Cookie-urile?",
        },
        items: [
            {
                en: "Cookies are small text files stored on your device when you visit a website.",
                ro: "Cookie-urile sunt fișiere text mici stocate pe dispozitivul tău atunci când vizitezi un site web.",
            },
            {
                en: "They help us remember your preferences and improve your experience.",
                ro: "Acestea ne ajută să reținem preferințele tale și să îți îmbunătățim experiența.",
            },
        ],
    },
    {
        title: {
            en: "Types of Cookies We Use",
            ro: "Tipuri de Cookie-uri Folosite",
        },
        items: [
            {
                en: "Essential cookies: Required for basic functionality and security.",
                ro: "Cookie-uri esențiale: Necesare pentru funcționalitatea și securitatea de bază.",
            },
            {
                en: "Analytics cookies: Used to measure usage via Google Analytics.",
                ro: "Cookie-uri de analiză: Folosite pentru a măsura utilizarea prin Google Analytics.",
            },
        ],
    },
    {
        title: {
            en: "Managing Your Preferences",
            ro: "Gestionarea Preferințelor",
        },
        items: [
            {
                en: "You can accept or decline cookies using the cookie banner when you visit our site.",
                ro: "Poți accepta sau refuza cookie-urile folosind bannerul de cookie-uri atunci când accesezi site-ul nostru.",
            },
            {
                en: "You can also manage cookies in your browser settings.",
                ro: "De asemenea, poți gestiona cookie-urile din setările browserului tău.",
            },
        ],
    },
    {
        title: {
            en: "Third-Party Cookies",
            ro: "Cookie-uri ale Terților",
        },
        items: [
            {
                en: "We use Google Analytics to collect anonymous statistics. This may set its own cookies.",
                ro: "Folosim Google Analytics pentru a colecta statistici anonime. Acesta poate seta propriile cookie-uri.",
            },
        ],
    },
    {
        title: {
            en: "Changes to This Policy",
            ro: "Modificări ale Acestei Politici",
        },
        items: [
            {
                en: "We may update this policy occasionally. Significant changes will be announced on our site.",
                ro: "Putem actualiza această politică ocazional. Modificările importante vor fi anunțate pe site-ul nostru.",
            },
        ],
    },
    {
        title: {
            en: "Contact",
            ro: "Contact",
        },
        items: [
            {
                en: "For any questions about our use of cookies, contact us at support@guestpilot.ai.",
                ro: "Pentru orice întrebări legate de utilizarea cookie-urilor, ne poți contacta la support@guestpilot.ai.",
            },
        ],
    },
];

const CookiePolicyPage = () => {
    const { language } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">
                {language === 'ro' ? 'Politica de Cookie-uri' : 'Cookie Policy'}
            </h1>

            {cookiePolicyItems.map((section, index) => (
                <div key={index} className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">
                        {index + 1}. {section.title[language]}
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {section.items.map((item, i) => (
                            <li key={i}>{item[language]}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default CookiePolicyPage;
