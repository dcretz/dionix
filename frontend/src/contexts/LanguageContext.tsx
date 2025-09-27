import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ro';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    technologies: 'Technologies',
    process: 'Process',
    contact: 'Contact',
    startProject: 'Start Project',
    
    // Hero
    professionalServices: 'Professional Web Development Services',
    heroTitle: 'Turn Your Ideas Into',
    heroTitleSpan: 'Digital Reality',
    heroSubtitle: 'We craft exceptional web applications, stunning websites, and powerful e-commerce platforms with royal quality and elegant simplicity.',
    projectsDelivered: 'Projects Delivered',
    yearsExperience: 'Years Experience',
    clientSatisfaction: 'Client Satisfaction',
    startYourProject: 'Start Your Project',
    viewPortfolio: 'View Portfolio',
    
    // Services
    ourServices: 'Our',
    servicesSpan: 'Services',
    servicesSubtitle: 'We deliver comprehensive web development solutions tailored to your business needs, combining technical excellence with elegant design.',
    webApplicationsTitle: 'Web Applications',
    webApplicationsDesc: 'Custom web applications built with modern frameworks and scalable architecture. From SaaS platforms to complex business tools.',
    modernWebsitesTitle: 'Modern Websites',
    modernWebsitesDesc: 'Responsive, fast-loading websites that look stunning on all devices. Perfect for businesses, portfolios, and corporate presence.',
    ecommerceTitle: 'E-commerce Platforms',
    ecommerceDesc: 'Complete e-commerce solutions with payment processing, inventory management, and customer engagement features.',
    learnMore: 'Learn More',
    cleanCode: 'Clean Code',
    cleanCodeDesc: 'Well-structured, maintainable code following industry best practices',
    fastDelivery: 'Fast Delivery',
    fastDeliveryDesc: 'Efficient development process with regular updates and milestones',
    secureReliable: 'Secure & Reliable',
    secureReliableDesc: 'Enterprise-grade security and reliability in every project',
    
    // Technologies
    technologiesTitle: 'Technologies &',
    technologiesSpan: 'Expertise',
    technologiesSubtitle: 'We stay current with the latest technologies and frameworks to deliver cutting-edge solutions that scale with your business.',
    alwaysLearning: 'Always Learning, Always Growing',
    alwaysLearningDesc: 'Technology evolves rapidly, and so do we. We continuously update our skills and explore new frameworks to provide you with the most modern and efficient solutions.',
    
    // Process
    ourProcess: 'Our',
    processSpan: 'Process',
    processSubtitle: 'A proven methodology that ensures your project is delivered on time, within budget, and exceeds your expectations.',
    discovery: 'Discovery',
    discoveryDesc: 'We start by understanding your business goals, target audience, and project requirements through detailed consultations.',
    planning: 'Planning',
    planningDesc: 'Strategic planning phase where we create wireframes, choose technologies, and establish project milestones.',
    development: 'Development', 
    developmentDesc: 'Agile development process with regular updates, code reviews, and continuous integration for quality assurance.',
    launch: 'Launch',
    launchDesc: 'Thorough testing, deployment to production, and post-launch support to ensure everything runs smoothly.',
    
    // Contact
    letsWork: "Let's Work",
    together: 'Together',
    contactSubtitle: 'Ready to bring your vision to life? Get in touch and let\'s discuss how we can help your business grow.',
    getInTouch: 'Get in Touch',
    yourName: 'Your name',
    emailAddress: 'Email address',
    projectDetails: 'Tell us about your project...',
    sendMessage: 'Send Message',
    contactInfo: 'Contact Information',
    
    // Footer
    footerDesc: 'Professional web development services delivering custom applications, modern websites, and e-commerce platforms with royal quality.',
    madeWith: 'Made with',
    forExperiences: 'for amazing digital experiences',
    ourProcess2: 'Our Process',
    contactUs: 'Contact Us',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    cookies: 'Cookies',
    allRightsReserved: 'All rights reserved.',
  },
  ro: {
    // Navigation
    home: 'Acasă',
    services: 'Servicii',
    technologies: 'Tehnologii',
    process: 'Proces',
    contact: 'Contact',
    startProject: 'Începe Proiectul',
    
    // Hero
    professionalServices: 'Servicii Profesionale de Dezvoltare Web',
    heroTitle: 'Transformă-ți Ideile în',
    heroTitleSpan: 'Realitate Digitală',
    heroSubtitle: 'Creăm aplicații web excepționale, site-uri web uimitoare și platforme e-commerce puternice cu calitate regală și simplitate elegantă.',
    projectsDelivered: 'Proiecte Livrate',
    yearsExperience: 'Ani Experiență',
    clientSatisfaction: 'Satisfacția Clienților',
    startYourProject: 'Începe Proiectul',
    viewPortfolio: 'Vezi Portofoliul',
    
    // Services
    ourServices: 'Serviciile',
    servicesSpan: 'Noastre',
    servicesSubtitle: 'Oferim soluții complete de dezvoltare web adaptate nevoilor afacerii tale, combinând excelența tehnică cu designul elegant.',
    webApplicationsTitle: 'Aplicații Web',
    webApplicationsDesc: 'Aplicații web personalizate construite cu framework-uri moderne și arhitectură scalabilă. De la platforme SaaS la instrumente complexe de business.',
    modernWebsitesTitle: 'Site-uri Web Moderne',
    modernWebsitesDesc: 'Site-uri web responsive, cu încărcare rapidă, care arată uimitor pe toate dispozitivele. Perfecte pentru afaceri, portofolii și prezența corporativă.',
    ecommerceTitle: 'Platforme E-commerce',
    ecommerceDesc: 'Soluții complete de e-commerce cu procesarea plăților, gestionarea inventarului și funcții de angajare a clienților.',
    learnMore: 'Află Mai Multe',
    cleanCode: 'Cod Curat',
    cleanCodeDesc: 'Cod bine structurat și ușor de întreținut, urmând cele mai bune practici din industrie',
    fastDelivery: 'Livrare Rapidă',
    fastDeliveryDesc: 'Proces eficient de dezvoltare cu actualizări regulate și jaloane',
    secureReliable: 'Sigur și Fiabil',
    secureReliableDesc: 'Securitate și fiabilitate de nivel enterprise în fiecare proiect',
    
    // Technologies
    technologiesTitle: 'Tehnologii și',
    technologiesSpan: 'Expertiză',
    technologiesSubtitle: 'Rămânem la curent cu cele mai noi tehnologii și framework-uri pentru a livra soluții de ultimă generație care se scalează cu afacerea ta.',
    alwaysLearning: 'Învățăm Mereu, Creștem Mereu',
    alwaysLearningDesc: 'Tehnologia evoluează rapid, la fel și noi. Ne actualizăm continuu abilitățile și explorăm noi framework-uri pentru a-ți oferi cele mai moderne și eficiente soluții.',
    
    // Process
    ourProcess: 'Procesul',
    processSpan: 'Nostru',
    processSubtitle: 'O metodologie dovedită care asigură că proiectul tău este livrat la timp, în limitele bugetului și depășește așteptările.',
    discovery: 'Descoperire',
    discoveryDesc: 'Începem prin înțelegerea obiectivelor afacerii tale, a publicului țintă și a cerințelor proiectului prin consultări detaliate.',
    planning: 'Planificare',
    planningDesc: 'Faza de planificare strategică în care creăm wireframe-uri, alegem tehnologiile și stabilim jaloanele proiectului.',
    development: 'Dezvoltare',
    developmentDesc: 'Proces de dezvoltare agil cu actualizări regulate, revizuiri de cod și integrare continuă pentru asigurarea calității.',
    launch: 'Lansare',
    launchDesc: 'Testare amănunțită, implementare în producție și suport post-lansare pentru a ne asigura că totul funcționează perfect.',
    
    // Contact
    letsWork: 'Să Lucrăm',
    together: 'Împreună',
    contactSubtitle: 'Gata să-ți aduci viziunea la viață? Contactează-ne și să discutăm cum putem ajuta afacerea ta să crească.',
    getInTouch: 'Contactează-ne',
    yourName: 'Numele tău',
    emailAddress: 'Adresa de email',
    projectDetails: 'Spune-ne despre proiectul tău...',
    sendMessage: 'Trimite Mesajul',
    contactInfo: 'Informații Contact',
    
    // Footer
    footerDesc: 'Servicii profesionale de dezvoltare web care livrează aplicații personalizate, site-uri web moderne și platforme e-commerce cu calitate regală.',
    madeWith: 'Făcut cu',
    forExperiences: 'pentru experiențe digitale uimitoare',
    ourProcess2: 'Procesul Nostru',
    contactUs: 'Contactează-ne',
    privacyPolicy: 'Politica de Confidențialitate',
    termsOfService: 'Termeni și Condiții',
    cookies: 'Cookie-uri',
    allRightsReserved: 'Toate drepturile rezervate.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};