import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Building2, Users, Shield, Clock } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Building2,
      title: "Enterprise Grade",
      description: "Built for organizations of all sizes with scalable architecture",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Secure access controls tailored to each department's needs",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Industry-standard security protocols and data protection",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Always-on access to critical business tools and information",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-hero text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
              About Employee Portal
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              Empowering organizations with secure, efficient, and intuitive 
              workforce management solutions.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Employee Portal is designed to streamline workplace operations by providing 
                a unified platform for all employee needs. From HR management to IT support, 
                from payroll to executive reporting, our platform brings together essential 
                business functions in one secure, accessible location.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-10">
              Why Choose Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="card-corporate p-6 text-center animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
