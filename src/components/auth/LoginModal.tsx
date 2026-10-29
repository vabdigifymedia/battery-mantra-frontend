import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { OtpLoginForm } from "@/components/auth/OtpLoginForm";
import { useModalStore } from "@/store/useModalStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Sparkles, Zap, ShieldCheck, Tag, Lock } from "lucide-react";

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginModal = ({ isOpen: propIsOpen, onClose: propOnClose }: LoginModalProps) => {
  const { isLoginModalOpen, closeLoginModal } = useModalStore();
  const isControlled = propIsOpen !== undefined;
  const open = isControlled ? propIsOpen : isLoginModalOpen;

  const handleClose = () => {
    if (isControlled) {
      propOnClose?.();
    } else {
      closeLoginModal();
    }
  };

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="flex flex-col">
      {/* Header with Glowing Icon & Headline */}
      <div className="p-4 sm:p-6 pb-3 border-b border-gray-100 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-primary/25 rounded-full blur-md animate-pulse" />
            <div className="relative w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 pr-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
              Welcome to Battery Mantra
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Login with mobile number for live technician tracking &amp; member discounts.
            </p>
          </div>
        </div>

        {/* Benefits Micro-Pill Row */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-gray-100/80">
          <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/80 p-1.5 rounded-lg border border-gray-100 shadow-2xs font-medium">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">45m Fitment</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/80 p-1.5 rounded-lg border border-gray-100 shadow-2xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Free Warranty</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-white/80 p-1.5 rounded-lg border border-gray-100 shadow-2xs font-medium">
            <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Scrap Rebate</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 sm:p-6 pt-4 space-y-4">
        <OtpLoginForm onSuccess={handleClose} />

        <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-gray-400" />
          <span>Your information is encrypted &amp; never shared with third parties.</span>
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
        <DialogContent className="sm:max-w-[440px] bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-0">
          <DialogTitle className="sr-only">Login to Battery Mantra</DialogTitle>
          <DialogDescription className="sr-only">
            Login with your mobile number to access saved orders and fast checkout.
          </DialogDescription>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
      <DrawerContent className="bg-white rounded-t-[24px] max-h-[85vh] outline-none">
        <DrawerTitle className="sr-only">Login to Battery Mantra</DrawerTitle>
        <DrawerDescription className="sr-only">
          Login with your mobile number to access saved orders and fast checkout.
        </DrawerDescription>
        {content}
      </DrawerContent>
    </Drawer>
  );
};
