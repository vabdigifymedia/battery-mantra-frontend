import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Youtube, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/contact-us")({
  component: ContactUsPage,
  head: () => ({
    meta: [
      { title: "Contact Us - BatteryMantra" },
      { name: "description", content: "Get in touch with BatteryMantra. Quick contact, email, and phone support for your battery and inverter needs." },
    ],
  }),
});

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Invalid mobile number (10 digits required)"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function ContactUsPage() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    console.log("Form data:", data);
    // In a real app, send to API
    toast.success("Message sent successfully! We will get back to you soon.");
    form.reset();
  };

  return (
    <div className="bg-muted/30 pb-20">
      
      {/* Header */}
      <div className="bg-primary/5 py-12 md:py-16 border-b border-border text-center">
        <Container>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">Contact Us</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto font-medium">
            Have a question or need assistance? We're here to help. Reach out to us using the details below or send us a message directly.
          </p>
        </Container>
      </div>

      <Container className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Contact Info */}
          <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Quick Contact</h2>
            <p className="text-muted-foreground text-sm mb-8">If you have any questions simply use the following contact details.</p>
            
            <div className="space-y-6 flex-grow">
              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm mb-1">Address:</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Shop No-4, Block-4 Ganga Shopping,<br />
                    Sector-29, Noida
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm mb-1">Email:</h3>
                  <div className="flex flex-col gap-1 text-sm">
                    <a href="mailto:info@batterymantra.com" className="text-primary hover:underline transition-all">info@batterymantra.com</a>
                    <a href="mailto:batterymantra@gmail.com" className="text-primary hover:underline transition-all">batterymantra@gmail.com</a>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-sm mb-1">Phone:</h3>
                  <a href="tel:+919200920051" className="text-foreground font-medium text-lg hover:text-primary transition-colors">
                    09200920051
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border flex gap-3">
              <a href="#" className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm"><Facebook className="h-5 w-5 fill-current" /></a>
              <a href="#" className="bg-blue-400 text-white p-2.5 rounded-full hover:bg-blue-500 transition-colors shadow-sm"><Twitter className="h-5 w-5 fill-current" /></a>
              <a href="#" className="bg-pink-600 text-white p-2.5 rounded-full hover:bg-pink-700 transition-colors shadow-sm"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="bg-blue-800 text-white p-2.5 rounded-full hover:bg-blue-900 transition-colors shadow-sm"><Linkedin className="h-5 w-5 fill-current" /></a>
              <a href="#" className="bg-red-600 text-white p-2.5 rounded-full hover:bg-red-700 transition-colors shadow-sm"><Youtube className="h-5 w-5 fill-current" /></a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-6">Send Message Us</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your Name*</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  {...form.register("name")} 
                  className={form.formState.errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile No.*</Label>
                <Input 
                  id="mobile" 
                  placeholder="e.g. 9876543210" 
                  {...form.register("mobile")} 
                  className={form.formState.errors.mobile ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {form.formState.errors.mobile && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {form.formState.errors.mobile.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Your email (Optional)</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="john@example.com" 
                  {...form.register("email")} 
                  className={form.formState.errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Your Message...</Label>
                <Textarea 
                  id="message" 
                  placeholder="How can we help you?" 
                  rows={4}
                  {...form.register("message")} 
                  className={form.formState.errors.message ? "border-red-500 focus-visible:ring-red-500 resize-none" : "resize-none"}
                />
                {form.formState.errors.message && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {form.formState.errors.message.message}</p>
                )}
              </div>
              
              {/* Fake ReCAPTCHA block for aesthetics just like the original, in a real app would use google-recaptcha */}
              <div className="bg-muted/30 border border-border rounded flex items-center justify-between p-3 h-[74px]">
                 <div className="flex items-center gap-3">
                   <div className="h-6 w-6 border-2 border-muted-foreground/30 rounded-sm bg-white shrink-0 cursor-pointer hover:border-primary/50 transition-colors"></div>
                   <span className="text-sm font-medium">I'm not a robot</span>
                 </div>
                 <div className="flex flex-col items-center">
                   <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="w-7 h-7" />
                   <div className="text-[9px] text-muted-foreground mt-1">reCAPTCHA</div>
                 </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Sending..." : "Submit Message"}
              </Button>
            </form>
          </div>

          {/* Map */}
          <div className="bg-slate-100 rounded-2xl overflow-hidden shadow-sm h-[400px] lg:h-auto min-h-[500px]">
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.200676483186!2d77.33230677550085!3d28.593757975685514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce505b38ed6b1%3A0x673998f82531d044!2sGanga%20Shopping%20Complex%2C%20Sector%2029%2C%20Noida%2C%20Uttar%20Pradesh%20201303!5e0!3m2!1sen!2sin!4v1709211029302!5m2!1sen!2sin" 
               width="100%" 
               height="100%" 
               style={{ border: 0 }} 
               allowFullScreen 
               loading="lazy" 
               referrerPolicy="no-referrer-when-downgrade"
               title="BatteryMantra Location"
             ></iframe>
          </div>
          
        </div>
      </Container>
    </div>
  );
}
