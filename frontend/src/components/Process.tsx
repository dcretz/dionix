import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MessageSquare, Palette, Code, Rocket, HeadphonesIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Process = () => {
  const { t } = useLanguage();
  
  const processSteps = [
    {
      icon: MessageSquare,
      title: t('discovery'),
      description: t('discoveryDesc'),
      details: [
        "Requirements gathering",
        "Technical analysis", 
        "Timeline planning",
        "Budget estimation"
      ]
    },
    {
      icon: Palette,
      title: t('planning'),
      description: t('planningDesc'),
      details: [
        "UI/UX design",
        "Brand integration",
        "Mobile responsiveness",
        "User experience optimization"
      ]
    },
    {
      icon: Code,
      title: t('development'),
      description: t('developmentDesc'),
      details: [
        "Frontend development",
        "Backend integration",
        "Database setup",
        "API development"
      ]
    },
    {
      icon: CheckCircle,
      title: "Testing & Quality Assurance",
      description: "Comprehensive testing across all devices and browsers to ensure flawless functionality and performance.",
      details: [
        "Cross-browser testing",
        "Performance optimization",
        "Security testing",
        "User acceptance testing"
      ]
    },
    {
      icon: Rocket,
      title: t('launch'),
      description: t('launchDesc'),
      details: [
        "Production deployment",
        "Analytics integration",
        "Performance monitoring",
        "SEO optimization"
      ]
    },
    {
      icon: HeadphonesIcon,
      title: "Support & Maintenance",
      description: "Ongoing support, updates, and maintenance to keep your project running smoothly and up-to-date.",
      details: [
        "24/7 monitoring",
        "Regular updates",
        "Bug fixes",
        "Feature enhancements"
      ]
    }
  ];
  return (
    <section id="process" className="py-20">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">{t('ourProcess')} {t('processSpan')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('processSubtitle')}
          </p>
        </div>

        {/* Process Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-royal rounded-full opacity-20"></div>

          {/* Process Steps */}
          <div className="space-y-12 lg:space-y-16">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className={`flex items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Content Card */}
                  <div className={`w-full lg:w-5/12 ${isEven ? 'lg:pr-8' : 'lg:pl-8'}`}>
                    <Card className="service-card">
                      <CardContent className="p-8">
                        <div className={`flex items-start gap-4 ${isEven ? 'text-left' : 'lg:text-right lg:flex-row-reverse'}`}>
                          <div className="w-12 h-12 bg-gradient-royal rounded-xl flex items-center justify-center flex-shrink-0 glow-royal">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {step.description}
                            </p>
                            <div className={`space-y-2 ${isEven ? 'text-left' : 'lg:text-right'}`}>
                              {step.details.map((detail, detailIndex) => (
                                <div key={detailIndex} className={`flex items-center gap-2 ${isEven ? 'justify-start' : 'lg:justify-end'}`}>
                                  <div className="w-1.5 h-1.5 bg-royal-blue rounded-full"></div>
                                  <span className="text-sm text-muted-foreground">{detail}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Timeline Node */}
                  <div className="hidden lg:flex w-2/12 justify-center">
                    <div className="w-8 h-8 bg-gradient-royal rounded-full flex items-center justify-center shadow-glow-royal">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden lg:block w-5/12"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-card rounded-2xl p-8 border border-border">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Your Project?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Let's discuss your project requirements and see how we can help bring your vision to life 
              with our proven development process.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;