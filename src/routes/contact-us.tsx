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
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendContactEmail } from "@/server/contact";

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
  recaptcha: z.string().min(1, "Please complete the reCAPTCHA"),
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
      recaptcha: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    try {
      await sendContactEmail(data);
      
      toast.success("Message Sent Successfully!", {
        description: "Our executive will call you soon.",
        icon: <AlertCircle className="h-5 w-5 text-green-500" />
      });
      
      form.reset();
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please check if SMTP is configured correctly or try again later."
      });
    }
  }

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

            <div className="mt-8 pt-8 border-t border-border flex gap-3 flex-wrap">
              <a href="https://facebook.com/batterymantra" target="_blank" rel="noreferrer" className="bg-[#1877F2] text-white p-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"><Facebook className="h-5 w-5 fill-current" /></a>
              <a href="https://twitter.com/batterymantra" target="_blank" rel="noreferrer" className="bg-black text-white p-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.5m0 0" /></svg>
              </a>
              <a href="https://instagram.com/batterymantra" target="_blank" rel="noreferrer" className="bg-gradient-to-tr from-[#fd5949] to-[#d6249f] text-white p-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.linkedin.com/company/batterymantra/" target="_blank" rel="noreferrer" className="bg-[#0A66C2] text-white p-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"><Linkedin className="h-5 w-5 fill-current" /></a>
              <a href="https://www.youtube.com/@batterymantra" target="_blank" rel="noreferrer" className="bg-[#FF0000] text-white p-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"><Youtube className="h-5 w-5" /></a>
              <a href="https://www.pinterest.com/batterymantra/" target="_blank" rel="noreferrer" className="bg-[#E60023] text-white p-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/></svg>
              </a>
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
              
              <div className="flex flex-col space-y-1.5">
                <ReCAPTCHA
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  onChange={(val) => {
                    form.setValue("recaptcha", val || "", { shouldValidate: true });
                  }}
                />
                {form.formState.errors.recaptcha && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" /> {form.formState.errors.recaptcha.message}</p>
                )}
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
