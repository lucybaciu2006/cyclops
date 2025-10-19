import { useLanguage } from '@/contexts/language.context';

export interface ToSSection {
    title: { en: string; ro: string };
    items: { en: string; ro: string }[];
}

const TermsOfServicePage = () => {
    const { language } = useLanguage(); // "en" or "ro"

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">
                {language === 'ro' ? 'Termeni și Condiții' : 'Terms of Service'}
            </h1>

            {items.map((section, index) => (
                <div key={index} className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">{index + 1}. {section.title[language]}</h2>
                    <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                        {section.items.map((item, i) => (
                            <li key={i}>{item[language]}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default TermsOfServicePage;

const items: ToSSection[] = [
    {
        title: { en: "Use of the Platform", ro: "Utilizarea Platformei" },
        items: [
            {
                en: "You may use our Platform only if you are at least 18 years old and legally able to enter into a binding contract.",
                ro: "Poți utiliza platforma noastră doar dacă ai cel puțin 18 ani și ai capacitate legală deplină de exercițiu.",
            },
        ],
    },
    {
        title: { en: "User Accounts", ro: "Conturi de Utilizator" },
        items: [
            {
                en: "To access certain features, you must register an account.",
                ro: "Pentru a accesa anumite funcționalități, trebuie să îți creezi un cont.",
            },
            {
                en: "You are responsible for maintaining the confidentiality of your login credentials.",
                ro: "Ești responsabil pentru păstrarea confidențialității datelor de autentificare.",
            },
        ],
    },
    {
        title: { en: "Subscription & Payments", ro: "Abonamente și Plăți" },
        items: [
            {
                en: "We offer a Free plan and a Pro plan. Pricing may vary by region.",
                ro: "Oferim un plan Gratuit și un plan Pro. Prețurile pot varia în funcție de regiune.",
            },
            {
                en: "For users in Romania: the Pro plan costs 199 RON/month + taxes.",
                ro: "Pentru utilizatorii din România: planul Pro costă 199 RON/lună + taxe.",
            },
            {
                en: "For users in the United States: the Pro plan costs $39/month + applicable taxes.",
                ro: "Pentru utilizatorii din Statele Unite: planul Pro costă 39 USD/lună + taxe aplicabile.",
            },
            {
                en: "Subscriptions renew automatically until canceled.",
                ro: "Abonamentele se reînnoiesc automat până la anulare.",
            },
        ],
    },
    {
        title: { en: "Privacy & Data", ro: "Confidențialitate și Date" },
        items: [
            {
                en: "We respect your privacy and process your data in accordance with applicable laws.",
                ro: "Respectăm confidențialitatea datelor tale și le procesăm conform legislației aplicabile.",
            },
            {
                en: "For EU users (including Romania): we comply with the General Data Protection Regulation (GDPR).",
                ro: "Pentru utilizatorii din UE (inclusiv România): respectăm Regulamentul General privind Protecția Datelor (GDPR).",
            },
            {
                en: "For US users: data is processed in accordance with applicable state and federal laws, including CCPA where relevant.",
                ro: "Pentru utilizatorii din SUA: datele sunt procesate conform legislației federale și de stat, inclusiv CCPA, unde este aplicabil.",
            },
        ],
    },
    {
        title: { en: "Limitation of Liability", ro: "Limitarea Răspunderii" },
        items: [
            {
                en: "We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.",
                ro: "Nu suntem răspunzători pentru daune indirecte, accidentale sau consecvente care decurg din utilizarea platformei.",
            },
            {
                en: "Use of the Platform is at your own risk.",
                ro: "Utilizarea platformei se face pe propriul risc.",
            },
        ],
    },
    {
        title: { en: "Governing Law", ro: "Legea Aplicabilă" },
        items: [
            {
                en: "For users in Romania and the EU, these terms are governed by Romanian and European Union law.",
                ro: "Pentru utilizatorii din România și din UE, acești termeni sunt guvernați de legislația română și a Uniunii Europene.",
            },
            {
                en: "For users in the United States, these terms are governed by the laws of the State of Delaware, United States.",
                ro: "Pentru utilizatorii din Statele Unite, acești termeni sunt guvernați de legile statului Delaware, Statele Unite ale Americii.",
            },
        ],
    },
    {
        title: { en: "Contact Us", ro: "Contact" },
        items: [
            {
                en: "If you have any questions, please contact us at support@guestpilot.ai.",
                ro: "Pentru orice întrebări, ne poți contacta la adresa support@guestpilot.ai.",
            },
        ],
    },
];
