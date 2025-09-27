import { useLanguage } from "@/contexts/LanguageContext";

const technologies = [
  {
    category: "Frontend",
    items: [
      { name: "React", level: 95 },
      { name: "TypeScript", level: 90 },
      { name: "Next.js", level: 85 },
      { name: "Vue.js", level: 80 },
      { name: "Tailwind CSS", level: 95 }
    ]
  },
  {
    category: "Backend", 
    items: [
      { name: "Node.js", level: 90 },
      { name: "Python", level: 85 },
      { name: "PostgreSQL", level: 85 },
      { name: "MongoDB", level: 80 },
      { name: "GraphQL", level: 75 }
    ]
  },
  {
    category: "DevOps & Tools",
    items: [
      { name: "Docker", level: 80 },
      { name: "AWS", level: 75 },
      { name: "Git", level: 95 },
      { name: "CI/CD", level: 80 },
      { name: "Figma", level: 85 }
    ]
  }
];

const Technologies = () => {
  const { t } = useLanguage();
  return (
    <section id="technologies" className="py-20 bg-royal-navy/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('technologiesTitle')} <span className="gradient-text">{t('technologiesSpan')}</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto">
            {t('technologiesSubtitle')}
          </p>
        </div>

        {/* Technologies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {technologies.map((category, index) => (
            <div key={index} className="bg-gradient-card rounded-2xl p-8 border border-border">
              <h3 className="text-2xl font-bold mb-6 gradient-text">{category.category}</h3>
              <div className="space-y-4">
                {category.items.map((tech, techIndex) => (
                  <div key={techIndex} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{tech.name}</span>
                      <span className="text-sm text-muted-foreground">{tech.level}%</span>
                    </div>
                    <div className="w-full bg-royal-dark rounded-full h-2">
                      <div 
                        className="bg-gradient-royal h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${tech.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-card rounded-2xl p-8 border border-border max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">{t('alwaysLearning')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('alwaysLearningDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["AI Integration", "Serverless", "JAMstack", "Progressive Web Apps", "Microservices"].map((tech, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-royal-blue/20 rounded-full text-sm border border-royal-blue/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Technologies;