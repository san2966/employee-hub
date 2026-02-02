import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Ticket } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
});

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);

  const generateTicketNumber = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `${year}${month}${day}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const ticketNumber = generateTicketNumber();

    try {
      // Insert ticket into database
      const { error: insertError } = await supabase.from("tickets").insert({
        ticket_number: ticketNumber,
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        description: formData.message.trim(),
        status: "Active",
      });

      if (insertError) throw insertError;

      // Send email notifications
      const { error: emailError } = await supabase.functions.invoke("send-ticket-email", {
        body: {
          type: "new",
          ticketNumber,
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          description: formData.message.trim(),
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        // Continue even if email fails
      }

      setGeneratedTicket(ticketNumber);
      toast({
        title: "Ticket Generated Successfully",
        description: `Your ticket number is ${ticketNumber}. We'll get back to you soon!`,
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Error generating ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "it.headvmcc@gmail.com" },
    { icon: Phone, label: "Phone", value: "8956663054" },
    { icon: MapPin, label: "Address", value: "2nd Floor, Lohia Jain Avenue" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-hero text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              Have questions? Generate a support ticket and we'll get back to you.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Contact Info */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Get in Touch</h2>
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="card-corporate p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Ticket className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Generate Support Ticket</h2>
                  </div>

                  {generatedTicket && (
                    <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-foreground">Your Ticket Number:</p>
                      <p className="text-2xl font-mono font-bold text-primary">{generatedTicket}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Save this number for future reference
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                          maxLength={255}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Description *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Please describe your issue in detail..."
                        rows={5}
                        maxLength={1000}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Generating Ticket..." : "Generate Ticket"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
