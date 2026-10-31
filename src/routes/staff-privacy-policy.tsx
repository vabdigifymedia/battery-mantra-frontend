import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Smartphone,
  Briefcase,
  Share2,
  Lock,
  UserX,
  Users,
  Clock,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  FileText,
  KeyRound,
  BellRing,
  Wifi,
} from "lucide-react";

export const Route = createFileRoute("/staff-privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy for Battery Mantra Staff App" },
      {
        name: "description",
        content:
          "Official Privacy Policy for Battery Mantra Staff App. Discloses information collection, device permissions, third-party services, data security, and account deletion for Google Play compliance.",
      },
      { property: "og:title", content: "Privacy Policy for Battery Mantra Staff App" },
      {
        property: "og:description",
        content:
          "Official privacy policy for authorized Battery Mantra personnel, partners, and field service engineers using the Battery Mantra Staff mobile application.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://batterymantra.com/staff-privacy-policy" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: StaffPrivacyPolicyPage,
});

function StaffPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-[#DE2027]/10 selection:text-[#DE2027]">
      {/* Top Brand Accent Bar */}
      <div className="h-1.5 w-full bg-[#DE2027]" />

      {/* Branded Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-3 transition-opacity hover:opacity-90"
            aria-label="Battery Mantra Home"
          >
            <img
              src="/logo.png"
              alt="Battery Mantra"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DE2027]/10 text-[#DE2027] border border-[#DE2027]/20">
              Staff & Partner Policy
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-[#DE2027] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Main Website</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          {/* Document Header Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DE2027] text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Google Play Store Policy
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                Last Updated: October 31, 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Privacy Policy for Battery Mantra Staff App
            </h1>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 text-base text-slate-600 leading-relaxed">
              <p>
                Battery Mantra (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting the privacy of our authorized personnel, partners, and field service engineers. This Privacy Policy specifically describes the collection, use, disclosure, and safeguarding of information when using our mobile application, <strong className="text-slate-900 font-semibold">Battery Mantra Staff App</strong> (the &ldquo;Application&rdquo;).
              </p>
              <p className="bg-slate-50 border-l-4 border-[#DE2027] p-4 rounded-r-lg text-slate-700 font-medium">
                By accessing or using the Application, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </div>

          {/* Section 1: Information We Collect */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Information We Collect
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              The Application is designed exclusively for authorized Battery Mantra staff, service engineers, delivery partners, and administrators. We collect:
            </p>

            <div className="grid gap-4 sm:grid-cols-1 pt-1">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-[#DE2027]/10 p-2 text-[#DE2027]">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">Account & Authentication Information</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      When you log into the Application, we collect your full name, registered mobile phone number, email address, and assigned staff role. Authentication is verified via One-Time Password (OTP) dispatched via SMS or WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-[#DE2027]/10 p-2 text-[#DE2027]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">Service & Order Fulfillment Data</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      In the course of handling battery delivery and installation services, staff and engineers process order numbers, customer delivery addresses, customer contact numbers, battery model details, serial numbers, old battery exchange details, and operational notes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-[#DE2027]/10 p-2 text-[#DE2027]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">Device & Notification Identifiers</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      We collect device hardware identifiers, operating system version, and Firebase Cloud Messaging (FCM) push notification tokens to ensure real-time delivery of order assignments, updates, and schedule notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Device Permissions Used in the App */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Device Permissions Used in the App
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              The Application requests only the minimal permissions required for operational workflows:
            </p>

            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="mt-0.5 rounded-md bg-[#DE2027]/10 p-1.5 text-[#DE2027]">
                  <Wifi className="h-4 w-4" />
                </div>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <strong className="font-semibold text-slate-900">
                    Internet & Network State (<code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-mono">INTERNET</code>, <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-mono">ACCESS_NETWORK_STATE</code>):
                  </strong>{" "}
                  Required to connect to Battery Mantra backend APIs, sync real-time order states, and confirm installations.
                </div>
              </li>

              <li className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="mt-0.5 rounded-md bg-[#DE2027]/10 p-1.5 text-[#DE2027]">
                  <BellRing className="h-4 w-4" />
                </div>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <strong className="font-semibold text-slate-900">
                    Notifications (<code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-mono">POST_NOTIFICATIONS</code>, <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-mono">VIBRATE</code>):
                  </strong>{" "}
                  Required to alert field engineers and partners immediately when new orders are assigned or modified.
                </div>
              </li>
            </ul>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-sm text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Note:</strong> The Application does <strong>NOT</strong> access user contacts, microphone, or external storage for advertising, nor does it track location in the background without explicit operational intent.
              </div>
            </div>
          </section>

          {/* Section 3: Purpose of Data Processing */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Purpose of Data Processing
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              We process collected data strictly for business and operational purposes:
            </p>

            <ul className="space-y-3">
              {[
                "Authenticating authorized staff and enforcing role-based access control.",
                "Assigning, managing, and tracking battery delivery and installation tasks.",
                "Dispatching real-time push alerts for order updates and schedule changes.",
                "Maintaining customer service logs, warranty registration, and scrap battery exchange auditing.",
                "Ensuring platform security and troubleshooting technical issues.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-[#DE2027] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4: Third-Party Services */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                4
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Third-Party Services
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              We share data only with trusted third-party service providers necessary to operate the Application:
            </p>

            <ul className="space-y-3">
              <li className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Google Cloud & Firebase Cloud Messaging (FCM):</strong> Used for secure push notification transmission.
              </li>
              <li className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">SMS & Messaging Gateways:</strong> Used strictly for sending login OTPs and service dispatch notifications.
              </li>
              <li className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Legal Compliance:</strong> We may disclose data if required by applicable Indian laws, subpoenas, or official government authority directives.
              </li>
            </ul>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-sm text-emerald-900 font-medium flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>We do <strong>NOT</strong> sell, rent, or monetize any user or staff data to third-party advertisers.</span>
            </div>
          </section>

          {/* Section 5: Data Security */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Data Security
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              We implement strict industry-standard technical and physical security measures, including HTTPS/TLS encryption in transit and access-controlled secure databases, to prevent unauthorized access or disclosure of personal and operational data.
            </p>
          </section>

          {/* Section 6: Data Retention and Account Deletion */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                6
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Data Retention and Account Deletion
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              We retain staff account information and service logs only as long as an individual remains an authorized partner or employee with Battery Mantra, or as required by commercial tax and auditing laws.
            </p>

            {/* Account & Data Deletion Callout Box */}
            <div className="p-5 sm:p-6 rounded-2xl border-2 border-[#DE2027]/30 bg-red-50/40 space-y-4">
              <div className="flex items-center gap-2.5 text-[#DE2027] font-bold text-base sm:text-lg">
                <UserX className="h-5 w-5" />
                <h3>How to Request Account & Data Deletion</h3>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Staff members, partners, or engineers can request the permanent deletion of their account credentials and personal profile data at any time by emailing{" "}
                <a
                  href="mailto:batterymantra@gmail.com?subject=Staff%20App%20Account%20Deletion%20Request"
                  className="font-semibold text-[#DE2027] underline decoration-[#DE2027]/40 hover:decoration-[#DE2027] transition-colors"
                >
                  batterymantra@gmail.com
                </a>{" "}
                or contacting their supervising Administrator. Verified deletion requests will be completed within 30 days.
              </p>

              <div className="pt-2">
                <a
                  href="mailto:batterymantra@gmail.com?subject=Staff%20App%20Account%20Deletion%20Request"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DE2027] text-white text-sm font-semibold hover:bg-[#DE2027]/90 transition-all shadow-sm shadow-[#DE2027]/20"
                >
                  <Mail className="h-4 w-4" />
                  Request Account Deletion via Email
                </a>
              </div>
            </div>
          </section>

          {/* Section 7: Children's Privacy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                7
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Children&apos;s Privacy
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              The Application is an enterprise/staff operational tool and is not intended for use by anyone under 18 years of age.
            </p>
          </section>

          {/* Section 8: Changes to This Policy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                8
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Changes to This Policy
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              We may periodically update this Privacy Policy. Any modifications will be published directly on this URL with an updated &ldquo;Last Updated&rdquo; date.
            </p>
          </section>

          {/* Section 9: Contact Us */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#DE2027]/10 flex items-center justify-center text-[#DE2027] shrink-0 font-bold text-base">
                9
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Contact Us
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              For any privacy-related questions or data deletion requests, contact us at:
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Organization</span>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#DE2027]" />
                  Battery Mantra
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Website</span>
                <p>
                  <a
                    href="https://batterymantra.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#DE2027] hover:underline flex items-center gap-1.5"
                  >
                    https://batterymantra.com
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Official Email</span>
                <p>
                  <a
                    href="mailto:batterymantra@gmail.com"
                    className="font-semibold text-[#DE2027] hover:underline flex items-center gap-1.5"
                  >
                    <Mail className="h-4 w-4" />
                    batterymantra@gmail.com
                  </a>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Support Hotline</span>
                <p>
                  <a
                    href="tel:+919200920051"
                    className="font-semibold text-[#DE2027] hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="h-4 w-4" />
                    +91-9200920051
                  </a>
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Registered Office</span>
                <p className="font-semibold text-slate-800 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#DE2027] mt-1 shrink-0" />
                  <span>Shop No-4, Block-4, Ganga Shopping, Sector 29, Noida, Uttar Pradesh</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Dedicated Clean Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Battery Mantra. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a
              href="https://batterymantra.com"
              className="hover:text-[#DE2027] transition-colors"
            >
              batterymantra.com
            </a>
            <a
              href="mailto:batterymantra@gmail.com"
              className="hover:text-[#DE2027] transition-colors"
            >
              batterymantra@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
