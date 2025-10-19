import { FAQPageStructure } from "./FAQPage.tsx";

const faqEn: FAQPageStructure = {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to the most common questions about our platform.',
    items: [
        {
            question: 'How does the platform work?',
            answer: 'You can sign up as a user or trainer and access all features after registration.'
        },
        {
            question: 'Is the service free?',
            answer: 'Basic usage is free, but some features require a subscription.'
        },
        {
            question: 'How can I reset my password?',
            answer: 'Go to the Forgot Password page and follow the steps.'
        },
        {
            question: 'Can I delete my account?',
            answer: 'Yes, you can do this from the My Account page under settings.'
        },
        {
            question: 'How do I contact support?',
            answer: 'Visit our contact page and fill in the form or send us an email.'
        }
    ]
};

export default faqEn;
