import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Smartphone, ShoppingCart, Code, Zap, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t } = useLanguage();
  
  const services = [
    {
      icon: Globe,
      title: t('webApplicationsTitle'),
      description: t('webApplicationsDesc'),
      features: ["React/NextJS", "Full-Stack Development", "API Integration", "Database Design"],
      color: "royal-blue"
    },
    {
      icon: Smartphone,
      title: t('modernWebsitesTitle'),
      description: t('modernWebsitesDesc'),
      features: ["Responsive Design", "SEO Optimized", "Performance Focus", "CMS Integration"],
      color: "royal-purple"
    },
    {
      icon: ShoppingCart,
      title: t('ecommerceTitle'),
      description: t('ecommerceDesc'),
      features: ["Payment Integration", "Inventory Management", "Admin Dashboard", "Analytics"],
      color: "royal-gold"
    }
  ];
  return (
    <section id="services" className="py-20 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text"> {t('ourServices')} {t('servicesSpan')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('servicesSubtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card 
                key={index} 
                className="service-card group cursor-pointer h-full"
              >
                <CardContent className="p-8 h-full flex flex-col">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-royal flex items-center justify-center mb-6 group-hover:shadow-glow-royal transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-royal-blue transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed flex-grow">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-royal-blue rounded-full"></div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button 
                    variant="outline" 
                    className="w-full border-royal-blue/30 hover:bg-royal-blue/10 hover:border-royal-blue transition-all duration-300"
                  >
                    {t('learnMore')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Choose Us */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-royal rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold mb-2">{t('cleanCode')}</h4>
            <p className="text-sm text-muted-foreground">{t('cleanCodeDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-royal rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold mb-2">{t('fastDelivery')}</h4>
            <p className="text-sm text-muted-foreground">{t('fastDeliveryDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-royal rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold mb-2">{t('secureReliable')}</h4>
            <p className="text-sm text-muted-foreground">{t('secureReliableDesc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;