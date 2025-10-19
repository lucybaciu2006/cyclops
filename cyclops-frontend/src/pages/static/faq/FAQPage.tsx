import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/language.context.tsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import faqRo from "@/pages/static/faq/faq-i18n.ro.ts";
import faqEn from "@/pages/static/faq/faq-i18n.en.ts";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQPageStructure {
  title: string;
  subtitle: string;
  items: FAQItem[];
}

const FAQPage = () => {
  const { language } = useLanguage();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faq: FAQPageStructure = language === 'ro' ? faqRo : faqEn;

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
        prev.includes(index)
            ? prev.filter(item => item !== index)
            : [...prev, index]
    );
  };

  return (
      <div className="min-h-screen flex flex-col py-8">
        <main className="flex-grow">
          <div className="container mx-auto px-4">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {faq.title}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {faq.subtitle}
              </p>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {faq.items.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <button
                          onClick={() => toggleItem(index)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 pr-4">
                          {item.question}
                        </h3>
                        {openItems.includes(index) ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      {openItems.includes(index) && (
                          <div className="px-6 pb-4">
                            <div className="border-t border-gray-100 pt-4">
                              <p className="text-gray-700 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                      )}
                    </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {language === 'ro' ? 'Contactează-ne' : 'Contact us'}
                </h2>
                <p className="text-gray-600 mb-6">{faq.subtitle}</p>
                <a
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {language === 'ro' ? 'Contactează-ne' : 'Contact us'}
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
};

export default FAQPage; 