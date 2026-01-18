import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, HelpCircle, Book, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "To reset your password, click on 'Forgot your password?' on the login page. You will receive an email with instructions to reset your password. If you don't receive the email, please contact your system administrator.",
    },
    {
      question: "How do I apply for leave?",
      answer: "Log in to your Employee Dashboard, navigate to 'Quick Actions' and click 'Apply Leave'. Fill in the required details including leave type, dates, and reason. Your request will be sent to your manager for approval.",
    },
    {
      question: "How can I view my payslips?",
      answer: "After logging in to the Employee Portal, go to your Dashboard. You'll find 'Recent Payslips' section where you can view and download your monthly payslips.",
    },
    {
      question: "Who do I contact for IT support?",
      answer: "For IT-related issues, you can raise a support ticket through the Help Desk portal or contact the IT department directly. For urgent matters, reach out to the IT Head through the internal directory.",
    },
    {
      question: "How do I update my personal information?",
      answer: "Navigate to your Profile section from the dashboard sidebar. You can update your contact information, emergency contacts, and other personal details. Some changes may require HR approval.",
    },
    {
      question: "What should I do if I'm locked out of my account?",
      answer: "If your account is locked due to multiple failed login attempts, wait 15 minutes and try again. If the issue persists, contact your system administrator or IT support for assistance.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const helpCategories = [
    { icon: Book, title: "User Guides", description: "Step-by-step guides for common tasks" },
    { icon: HelpCircle, title: "FAQ", description: "Frequently asked questions" },
    { icon: MessageCircle, title: "Support", description: "Contact our support team" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-hero text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
              Help Center
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
              Find answers to common questions and get the help you need.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card text-foreground"
                maxLength={100}
              />
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {helpCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="card-corporate p-6 text-center animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-8">
                Frequently Asked Questions
              </h2>
              
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="card-corporate px-6 border-0"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium text-foreground">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
