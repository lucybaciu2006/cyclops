import React from 'react';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import { Footer } from '@/components/layout/Footer';
import {Check, Zap} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
          {/* How It Works */}
          <section className="py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-16">
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                          Get Started in 3 Simple Steps
                      </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                          {
                              step: 1,
                              title: 'Add Your Property',
                              description: 'Import details from your booking platform or enter manually'
                          },
                          {
                              step: 2,
                              title: 'Configure Rules & Amenities',
                              description: 'Set up check-in procedures, house rules, and available facilities'
                          },
                          {
                              step: 3,
                              title: 'Activate & Go Live',
                              description: 'Get your dedicated phone number and start receiving calls'
                          }
                      ].map((step, index) => (
                          <div key={index} className="text-center">
                              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                  {step.step}
                              </div>
                              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                              <p className="text-muted-foreground">{step.description}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
              <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      Ready to Transform Your Guest Experience?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8">
                      Join thousands of hosts who never miss a guest call again
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                      <Button size="lg" className="text-lg px-8">
                          <Zap className="h-5 w-5 mr-2" />
                          Start Your Free Trial
                      </Button>
                  </div>

                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center">
                          <Check className="h-4 w-4 text-success mr-2" />
                          No setup fees
                      </div>
                      <div className="flex items-center">
                          <Check className="h-4 w-4 text-success mr-2" />
                          Cancel anytime
                      </div>
                      <div className="flex items-center">
                          <Check className="h-4 w-4 text-success mr-2" />
                          5-minute setup
                      </div>
                  </div>
              </div>
          </section>
        <PricingSection />
      </main>
    </div>
  );
};

export default LandingPage;
