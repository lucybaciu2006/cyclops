import React from 'react';
import { useLanguage } from '../contexts/language.context';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

const HowItWorksPage = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col">
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {t('howItWorks.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          {/* Content Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  {t('howItWorks.step1')}
                </p>

                <p className="text-lg">
                  {t('howItWorks.step2')}
                </p>

                <p className="text-lg">
                  {t('howItWorks.step3')}
                </p>

                <p className="text-lg">
                  {t('howItWorks.step4')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorksPage; 