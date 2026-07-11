import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { MapPin, Mail, Phone, ShieldCheck, Truck, Zap } from "lucide-react";
import { APP } from "@/constants/app";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: `About Us — ${APP.name}` },
      { name: "description", content: "Learn more about Battery Mantra, India's famous battery store." },
    ],
  }),
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <div className="bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/about_us_hero.png"
            alt="About Battery Mantra"
            className="h-full w-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
            ABOUT US
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl font-medium drop-shadow">
            India&apos;s famous battery store where you can get every type of battery at a reasonable price.
          </p>
        </div>
      </div>

      <Container size="lg" className="relative -mt-12 sm:-mt-16 z-10 px-4">
        {/* Contact Info Card */}
        <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between items-center text-center sm:text-left mb-16">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-foreground/80">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">Visit Us</p>
              <p className="text-sm">Shop No-4, Block-4 Ganga Shopping, Sector-29, Noida</p>
            </div>
          </div>
          
          <div className="w-px h-12 bg-border hidden sm:block"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-foreground/80">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">Email Us</p>
              <a href="mailto:info@batterymantra.com" className="text-sm hover:text-primary transition-colors">info@batterymantra.com</a>
            </div>
          </div>

          <div className="w-px h-12 bg-border hidden sm:block"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-foreground/80">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">Call Us</p>
              <a href="tel:09200920051" className="text-sm hover:text-primary transition-colors">09200920051</a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none space-y-12">
          
          {/* Welcome Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <Zap className="h-8 w-8 text-primary" />
              Welcome to Battery Mantra
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Are you searching for a battery that can restart your old inverter or upgrade one? Is your car battery not performing the way you want it? Wait! Don't go anywhere else, as you are in the right place. We are Battery Mantra, India's famous battery store where you can get every type of battery at a reasonable price.
            </p>
          </section>

          <hr className="border-border" />

          {/* What do we do Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">What do we do?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our company has been providing quality services to clients since 2006. We know the rising demand of our clients and understand their requirements. Our motive is to make your projects hassle-free. Battery Mantra has a huge variety of brands available from which one can choose the battery of your choice.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Luminous inverter, Exide Car Battery, Amaron Battery, AC Delco, Livgaurd, Livfast, SF Sonic,</strong> are some of the brands we have in our collection. All the items available in our online store are of premium quality and top-branded. It's one of the reasons why we have been successful in retaining our esteemed customers from years.
            </p>
          </section>

          <div className="grid sm:grid-cols-2 gap-8 my-12">
            <div className="bg-primary-soft border border-primary/20 p-8 rounded-2xl">
              <Truck className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Fastest Delivery at Your Doorstep</h3>
              <p className="text-muted-foreground text-base">
                Get your item delivered to your doorstep with easy return options to change them if any problem arises. Our esteemed customers believe us as we provide them with the best quality batteries at affordable rates.
              </p>
            </div>
            
            <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm">
              <ShieldCheck className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Battery with Warranty</h3>
              <p className="text-muted-foreground text-base">
                Battery Mantra is truly a one-stop solution that caters to all your requirements. Our company is growing fast as our main focus is to give the customers what they ask for. When you buy an item through us, you'll be provided with comprehensive warranty options, specifically available for our dear customers.
              </p>
            </div>
          </div>

          <section className="text-center max-w-2xl mx-auto space-y-6 pb-8">
            <p className="text-lg font-medium text-foreground">
              We are currently located in Noida, India and have been serving our pan India customers with premium delivery services. To avail high-quality batteries with extra-life, more power, and high performance at reasonable pricing, place your order today.
            </p>
            <p className="text-primary font-bold uppercase tracking-widest pt-4">
              Group Of Vikas Traders
            </p>
          </section>
          
        </div>
      </Container>
    </div>
  );
}
