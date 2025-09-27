import { Code, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="py-12 border-t border-border bg-royal-dark">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-royal rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Dionix Softworks</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              {t('footerDesc')}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{t('madeWith')}</span>
              <Heart className="w-4 h-4 text-royal-purple" />
              <span>{t('forExperiences')}</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4">{t('services')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#services" className="hover:text-royal-blue transition-colors">{t('webApplicationsTitle')}</a></li>
              <li><a href="#services" className="hover:text-royal-blue transition-colors">{t('modernWebsitesTitle')}</a></li>
              <li><a href="#services" className="hover:text-royal-blue transition-colors">{t('ecommerceTitle')}</a></li>
              <li><a href="#services" className="hover:text-royal-blue transition-colors">Consulting</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#process" className="hover:text-royal-blue transition-colors">{t('ourProcess2')}</a></li>
              <li><a href="#technologies" className="hover:text-royal-blue transition-colors">{t('technologies')}</a></li>
              <li><a href="#contact" className="hover:text-royal-blue transition-colors">{t('contactUs')}</a></li>
              <li><a href="#" className="hover:text-royal-blue transition-colors">{t('privacyPolicy')}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Dionix Softworks. {t('allRightsReserved')}
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-royal-blue transition-colors">
              {t('termsOfService')}
            </a>
            <a href="#" className="text-muted-foreground hover:text-royal-blue transition-colors">
              {t('privacyPolicy')}
            </a>
            <a href="#" className="text-muted-foreground hover:text-royal-blue transition-colors">
              {t('cookies')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;