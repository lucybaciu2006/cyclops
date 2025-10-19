import {FAQPageStructure} from "@/pages/static/faq/FAQPage.tsx";

const faqRo: FAQPageStructure = {
    title: 'Întrebări frecvente',
    subtitle: 'Găsește răspunsuri la cele mai comune întrebări despre platforma noastră.',
    items: [
        {
            question: 'Cum funcționează platforma?',
            answer: 'Te poți înregistra ca utilizator sau antrenor și accesa toate funcționalitățile după autentificare.'
        },
        {
            question: 'Este serviciul gratuit?',
            answer: 'Utilizarea de bază este gratuită, însă unele funcții necesită abonament.'
        },
        {
            question: 'Cum îmi resetez parola?',
            answer: 'Accesează pagina „Ai uitat parola” și urmează pașii.'
        },
        {
            question: 'Pot să-mi șterg contul?',
            answer: 'Da, poți face acest lucru din pagina Contul Meu, secțiunea setări.'
        },
        {
            question: 'Cum pot contacta suportul?',
            answer: 'Accesează pagina de contact și completează formularul sau trimite-ne un email.'
        }
    ]
};

export default faqRo;
