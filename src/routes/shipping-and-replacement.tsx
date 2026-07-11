import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { APP } from "@/constants/app";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/shipping-and-replacement")({
  head: () => ({
    meta: [
      { title: `Shipping & Replacement — ${APP.name}` },
      { name: "description", content: "Shipping and replacement policy for Battery Mantra." },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <div className="bg-background pb-20">
      <PageHeader
        title="Shipping & Replacement"
        description="Learn about our delivery process and replacement guidelines."
      />
      
      <Container size="md" className="mt-12">
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none space-y-8">
          
          <section>
            <p>
              Battery Mantra ensures delivery of products sold through it's website within maximum 24 Hours. We make sure that all the products that reach to your house are functional and have no defects.
            </p>
          </section>

          <section>
            <h2>Replacement Policy</h2>
            <p>
              <strong>a)</strong> You may initiate the request for replacement of the Product within two days from the time the Product (s) is delivered to you ("Replacement Period") if:
            </p>
            <ul>
              <li><strong>(i)</strong> the Product is received in a physically damaged condition and reported to us within 24 hours of delivery.</li>
              <li><strong>(ii)</strong> Product is faulty or is not in a working situation, to be reported to us within 24 hours of delivery;</li>
              <li><strong>(iii)</strong> Product or parts of the Product or accessory are missing, reported to us within 24 hours of delivery.</li>
            </ul>
            <p>
              All our packages come with "Tamper Evident Void Seals." Please ensure that you do not accept packages where the seal has been tampered with. Approval of a tampered "Void Seal" or a harmed box will automatically disqualify you from any replacement declarations for physically damaged/faulty products, wrong Products, or missing accessories.
            </p>

            <p>
              <strong>b)</strong> You shall keep the Products in their unused, original condition, along with the original invoice/ sale receipt, brand outer box, MRP tags attached, user manual, warranty cards, and original supplements in manufacturer packaging for a victorious replacement pick-up. We would accept the request for the replacement of such Product subject to the terms of this policy.
            </p>

            <p>
              <strong>c)</strong> Your replacement will be processed only when the conditions as may be stipulated by us are fulfilled at the time of replacement of such Products, such as the Product to be replaced being provided to us in the original condition along with the price tag intact including original packaging of the Product, the serial number/ bar code of the Product matches our records, if Product(s) bought as a combo then Product(s) sent for a replacement to be as a complete combo, the brand outer packaging of the Product and all accessories therein shall be intact, no damage has occurred post-delivery of the Product while in your possession, etc.
            </p>

            <p>
              <strong>d)</strong> You agree that we will not replace any Product: (i) if you have placed the order for a wrong Product model, color, or incorrect Product, (ii) if the Product belongs to the non-replacement Product category (iii) if you fail to request replacement/register a complaint about a damaged, defective or inaccurate Product within the Replacement Period. Any damage to the Product caused by your improper use of the Product, any modification or change to the Product by you, the User, or a third party, or any depreciation in the value for other reasons will not be deemed such Product a damaged defective or inaccurate Product. It will not be considered a quality problem. Any judgment by us in this respect shall be final and binding.
            </p>
          </section>

          <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl mt-8">
            <p className="font-medium text-foreground mb-2">Note:</p>
            <p className="text-muted-foreground">We only give a product replacement; no return is applicable.</p>
            <p className="text-muted-foreground mt-4">
              For more details about replacement policy, Call us at <a href="tel:+919200920051" className="text-primary font-bold hover:underline">+91-9200920051</a>
            </p>
          </div>

        </div>
      </Container>
    </div>
  );
}
