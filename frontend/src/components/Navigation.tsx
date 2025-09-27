import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Code, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-royal-dark/90 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-royal rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Dionix Softworks</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-foreground hover:text-royal-blue transition-colors">
              {t('home')}
            </a>
            <a href="#services" className="text-foreground hover:text-royal-blue transition-colors">
              {t('services')}
            </a>
            <a href="#technologies" className="text-foreground hover:text-royal-blue transition-colors">
              {t('technologies')}
            </a>
            <a href="#process" className="text-foreground hover:text-royal-blue transition-colors">
              {t('process')}
            </a>
            <a href="#contact" className="text-foreground hover:text-royal-blue transition-colors">
              {t('contact')}
            </a>
          </div>

          {/* Language Toggle & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ro' : 'en')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-royal-blue/30 hover:bg-royal-blue/10 transition-colors"
            >
              <Languages className="w-4 h-4" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>
            <Button variant="default" 
              className="bg-gradient-royal hover:shadow-glow-royal transition-all duration-300"
              onClick={() => { window.location.href = '#contact'; }}
            >
              {t('startProject')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <a href="#home" className="text-foreground hover:text-royal-blue transition-colors py-2">
                {t('home')}
              </a>
              <a href="#services" className="text-foreground hover:text-royal-blue transition-colors py-2">
                {t('services')}
              </a>
              <a href="#technologies" className="text-foreground hover:text-royal-blue transition-colors py-2">
                {t('technologies')}
              </a>
              <a href="#process" className="text-foreground hover:text-royal-blue transition-colors py-2">
                {t('process')}
              </a>
              <a href="#contact" className="text-foreground hover:text-royal-blue transition-colors py-2">
                {t('contact')}
              </a>
              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ro' : 'en')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-royal-blue/30 hover:bg-royal-blue/10 transition-colors"
                >
                  <Languages className="w-4 h-4" />
                  <span className="text-sm font-medium">{language.toUpperCase()}</span>
                </button>
                <Button variant="default" className="bg-gradient-royal hover:shadow-glow-royal transition-all duration-300 flex-1">
                  {t('startProject')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;