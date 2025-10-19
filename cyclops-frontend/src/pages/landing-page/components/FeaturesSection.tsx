import {Card, CardContent} from "@/components/ui/card";
import {BarChart3, MicIcon, Phone, SettingsIcon, UserIcon, Users, Zap} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Phone,
      title: '24/7 AI Assistant',
      description: 'Your AI answers calls automatically, handling guest inquiries professionally'
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Configure your property rules and amenities in minutes'
    },
    {
      icon: Users,
      title: 'Guest Satisfaction',
      description: 'Provide immediate responses to guest questions anytime'
    },
    {
      icon: BarChart3,
      title: 'Call Analytics',
      description: 'Track call volumes and guest interactions with detailed reports'
    }
  ];

  return (
    <>
      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Automate Guest Support
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed specifically for vacation rental hosts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                  <Card key={index} className="text-center p-6 hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        </div>
      </section>

    </>
  );
};
