import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { callbacksService } from "@/services/catalog.service";
import { PhoneCall, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";

export function CallbackBanner() {
  const [mobileNo, setMobileNo] = useState("");
  const mutation = useMutation({
    mutationFn: (mobileNumber: string) => callbacksService.create({ mobileNumber }),
    onSuccess: () => {
      toast.success("Request sent! We will call you back shortly.");
      setMobileNo("");
    },
    onError: () => {
      toast.error("Failed to send request. Please try again.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNo.trim() || mobileNo.length < 10) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    mutation.mutate(mobileNo);
  };

  return (
    <section className="bg-surface border-y border-border py-12 sm:py-16 mt-16 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/20 pattern-size-4 pattern-opacity-20 pointer-events-none" />
      <div className="absolute right-0 top-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
      
      <Container size="xl" className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Graphic Side */}
          <div className="hidden lg:flex justify-center relative order-1 lg:order-2">
            <img 
              src="/images/requestCallback Section image.png" 
              alt="Request Callback"
              className="w-full max-w-lg xl:max-w-xl h-auto object-contain drop-shadow-xl scale-110 hover:scale-115 transition-transform duration-500"
            />
          </div>

          {/* Form Side */}
          <div className="flex flex-col space-y-6 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-4">
                <img 
                  src="/images/requestCallback Section image.png" 
                  alt=""
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain lg:hidden mb-2 lg:mb-0 scale-110"
                />
                Request a CallBack
              </h2>
              <p className="text-muted-foreground text-lg">
                Enter your mobile no. and we'll call you as soon as possible
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto lg:mx-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="tel"
                  placeholder="Your Mobile No."
                  className="flex-1 h-12 text-lg shadow-sm"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  disabled={mutation.isPending}
                />
                <Button 
                  type="submit" 
                  variant="brand" 
                  size="lg" 
                  className="h-12 px-8 text-base shadow-md hover:shadow-lg transition-shadow"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Sending..." : "Send Request"}
                  {!mutation.isPending && <Send className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            </form>

            <div className="pt-4 flex items-center justify-center lg:justify-start gap-2 text-muted-foreground text-lg">
              <span>or Call us to</span>
              <a href="tel:09200920051" className="text-primary font-bold text-2xl hover:underline ml-1">
                09200920051
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
