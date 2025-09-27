import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroGeometric from "@/assets/hero-geometric.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const Hero = () => {
  const { t } = useLanguage();
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative geometric-bg overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroGeometric} 
          alt="Abstract geometric web development illustration with 3D shapes and royal blue lighting"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-dark opacity-70"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-royal-navy/50 backdrop-blur-sm border border-royal-blue/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-royal-gold" />
            <span className="text-sm font-medium">{t('professionalServices')}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t('heroTitle')}
            <span className="gradient-text block">{t('heroTitleSpan')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">30+</div>
              <div className="text-sm text-muted-foreground">{t('projectsDelivered')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">3+</div>
              <div className="text-sm text-muted-foreground">{t('yearsExperience')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">100%</div>
              <div className="text-sm text-muted-foreground">{t('clientSatisfaction')}</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-royal hover:shadow-glow-royal transition-all duration-300 transform hover:scale-105"
              onClick={() => { window.location.href = '#contact'; }}
            >
              {t('startYourProject')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-royal-blue/30 hover:bg-royal-blue/10 hover:border-royal-blue transition-all duration-300"
              onClick={() => { window.location.href = '#contact'; }}
            >
              {t('viewPortfolio')}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-16 h-16 bg-royal-blue/10 rounded-lg animate-float hidden lg:block"></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-royal-purple/10 rounded-full animate-float hidden lg:block" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-8 h-8 bg-royal-gold/10 rounded-lg animate-float hidden lg:block" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};

export default Hero;