import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
    {
        name: 'Free',
        price: '0 RON',
        description: 'Great for testing the platform before going live.',
        features: [
            'Create one property',
            'Configure rules and amenities',
            'Preview voice assistant',
        ],
        cta: 'Try for Free',
        featured: false,
    },
    {
        name: 'Pro',
        price: '199 RON / month',
        subtext: '+ taxes',
        description: 'Best for property owners ready to go live.',
        features: [
            'Unlimited properties',
            'Dedicated local phone number',
            'Real-time call routing',
            'Advanced analytics',
            'Priority support',
        ],
        cta: 'Start Free Trial',
        featured: true,
    },
];

const PricingSection = () => {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background border-t">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Simple, Transparent Pricing
                </h2>
                <p className="text-muted-foreground text-lg">
                    Start for free. Upgrade when you’re ready to scale.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {plans.map((plan, idx) => (
                    <div
                        key={idx}
                        className={`rounded-2xl border shadow-sm p-8 text-left ${
                            plan.featured ? 'border-primary bg-primary/5' : 'bg-white'
                        }`}
                    >
                        <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                        <p className="text-3xl font-bold text-foreground mb-1">{plan.price}</p>
                        {plan.subtext && (
                            <p className="text-sm text-muted-foreground mb-4">{plan.subtext}</p>
                        )}
                        <p className="text-muted-foreground mb-6">{plan.description}</p>

                        <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start text-sm text-foreground">
                                    <Check className="h-4 w-4 text-success mt-0.5 mr-2" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Button className="w-full">{plan.cta}</Button>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default PricingSection;
