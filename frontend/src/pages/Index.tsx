import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Technologies from "@/components/Technologies";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <Services />
        <Technologies />
        <Process />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;