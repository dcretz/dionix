import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, Clock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    project: "",
    budget: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      console.log(response);

      toast({
        title: "Message Sent!",
        description: "Thank you for your inquiry. We'll get back to you within 24 hours.",
      });

      setFormData({ name: "", email: "", project: "", budget: "", message: "" });

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "There was an issue sending your message. Please try again later.",
      });
      return;
    }

  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-20 bg-royal-navy/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('letsWork')} <span className="gradient-text">{t('together')}</span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto">
            {t('contactSubtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="service-card">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">{t('getInTouch')}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      {t('yourName')} *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-royal-dark border-border focus:border-royal-blue"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      {t('emailAddress')} *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-royal-dark border-border focus:border-royal-blue"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="project" className="block text-sm font-medium mb-2">
                      Project Type
                    </label>
                    <select
                      id="project"
                      name="project"
                      value={formData.project}
                      onChange={handleChange}
                      className="w-full p-2 bg-royal-dark border border-border rounded-md focus:border-royal-blue focus:ring-1 focus:ring-royal-blue text-foreground"
                    >
                      <option value="">Select project type</option>
                      <option value="web-app">Web Application</option>
                      <option value="website">Website</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium mb-2">
                      Budget Range
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full p-2 bg-royal-dark border border-border rounded-md focus:border-royal-blue focus:ring-1 focus:ring-royal-blue text-foreground"
                    >
                      <option value="">Select budget range</option>
                      <option value="5k-10k">$5,000 - $10,000</option>
                      <option value="10k-25k">$10,000 - $25,000</option>
                      <option value="25k-50k">$25,000 - $50,000</option>
                      <option value="50k+">$50,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Project Details *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="bg-royal-dark border-border focus:border-royal-blue resize-none"
                    placeholder={t('projectDetails')}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-royal hover:shadow-glow-royal transition-all duration-300"
                  size="lg"
                >
                  {t('sendMessage')}
                  <Send className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <Card className="service-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">{t('contactInfo')}</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-royal rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Email</h4>
                      <p className="text-muted-foreground">lions.dion@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-royal rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Phone</h4>
                      <p className="text-muted-foreground">+4 0757 613 387</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-royal rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Response Time</h4>
                      <p className="text-muted-foreground">Within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-royal rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Availability</h4>
                      <p className="text-muted-foreground">Worldwide remote work</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="service-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Quick FAQ</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">How long does a typical project take?</h4>
                    <p className="text-sm text-muted-foreground">
                      Project timelines vary from 2-12 weeks depending on complexity and scope.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Do you provide ongoing support?</h4>
                    <p className="text-sm text-muted-foreground">
                      Yes, we offer maintenance packages and ongoing support for all projects.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Can you work with existing designs?</h4>
                    <p className="text-sm text-muted-foreground">
                      Absolutely! We can work with your existing designs or create new ones.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;