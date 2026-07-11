import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { APP } from "@/constants/app";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: `Terms & Conditions — ${APP.name}` },
      { name: "description", content: "Terms and Conditions of using Battery Mantra." },
    ],
  }),
  component: TermsAndConditionsPage,
});

function TermsAndConditionsPage() {
  return (
    <div className="bg-background pb-20">
      <PageHeader
        title="Terms & Conditions"
        description="Please read these terms carefully before using our services."
      />
      
      <Container size="md" className="mt-12">
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none space-y-8">
          
          <p>
            Using services given by www.Batterymantra.com indicates you admit the service terms and conditions of the organization. So, we request you to read our terms and conditions very thoroughly before using our service.
          </p>
          <p>
            Promising to or using services given by Batterymantra means you have read, understood, and are bound by the terms (it doesn't matter how you have subscribed or used our service). If you do not accept or want to be restricted by the terms and conditions, you are advised not to subscribe to or use our services.
          </p>
          <p>
            In these terms, "you" or "User" means the end-users, who are reaching the website of Batterymantra, its contents and using the Services granted through the website; "Service Providers" referred to third party service providers and "We," "Us" and "Our" means Batterymantra.com and its members.
          </p>

          <section>
            <h2>Introduction</h2>
            <p>
              www.Batterymantra.com ("Website") is an Internet-based e-commerce and content website owned and managed by XXX, an organization authorized under the laws of India.
            </p>
            <p>
              You can use the website after receiving conditions without changing all the terms, conditions, and notices restricted in these Terms, as may be posted on the website of www.Batterymantra.com on various periods. www.Batterymantra.com, at its discretion, holds the right not to allow a User from registering on its entrance without specifying any reason thereof.
            </p>
          </section>

          <section>
            <h2>User Account, Password, and Security</h2>
            <p>
              After completion of the registration process, you will get a password and user ID. It is solely your responsibility to keep the privacy of the account and password. You are liable for every activity done under your password and account. By accepting our terms of usage, you get to:
            </p>
            <ul>
              <li>Notify us of any illegal use of your password or account or any other breach of security; and</li>
              <li>Assure that after the end of each session, you will exit from your account. We will not be responsible for any loss or harm caused because you failed to comply with this policy.</li>
            </ul>
          </section>

          <section>
            <h2>Services Offered</h2>
            <p>
              We provide various Internet-based services by the website (all such services, collectively, the "Service"). One such service allows users to buy products like car batteries and inverter batteries. Soon after you put the order, we shall deliver the goods to you and are called to pay for products/services purchased by you.
            </p>
          </section>

          <section>
            <h2>Privacy Policy</h2>
            <p>
              As the user at this second, you allow, express, and accept that you have read and fully understand our Privacy Policy regarding the website. You, as the user, further support that the terms and contents of such Privacy Policy are agreeable to you.
            </p>
          </section>

          <section>
            <h2>Limited User</h2>
            <p>
              You have to accept and undertake not to reverse engineer, modify copy, share, transfer, exhibit, perform, reproduce, publish, license, design copied works from, shift, or sell any information or software acquired from the website. Limited copying or duplicating of the website's contents is allowed if Batterymantra's name is stated as the source and our approach wrote permission is asked. To reduce any doubt, it is explained that boundless or wholesale reproduction and copying of the website's content for commercial or non-commercial reasons and additional amendment of data and information within the website's content is not allowed.
            </p>
          </section>

          <section>
            <h2>The platform for Transaction and Communication</h2>
            <p>
              The Website is a program that Users use to meet and communicate with one another for their businesses. Batterymantra is not and cannot be a party to or control any transaction among the Website's Users.
            </p>
            <p>Henceforward:</p>
            <ol>
              <li>All commercial/contractual terms are given by and agreed to among Buyers and Sellers alone. The commercial/contractual terms cover without control price, transportation costs, payment plans, payment terms, date, period, and delivery method, warranties associated with products and services, and after-sales services associated with products and services. Batterymantra.com does not have any control or does not manage or advise or in any way prove itself in the offering or receiving of such commercial/contractual terms between the Buyers and Sellers.</li>
              <li>Batterymantra does not make any illustration or warranty as to specifics (such as property, value, salability, etc.) of the goods or services proposed to be sold or given to be sold or purchased on the Website. Batterymantra does not inherently or explicitly promote or endorse the sale or purchase of any products or services on the Website. Batterymantra admits no liability for any errors or omissions, whether on behalf of itself or third parties.</li>
              <li>Batterymantra is not liable for any non-performance or violation of any agreement entered among Buyers and Sellers. Batterymantra can not warrant that the concerned Buyers and Sellers will make any transaction ended on the Website. Batterymantra shall not be asked to negotiate or resolve any conflict or dispute between Buyers and Sellers.</li>
              <li>Batterymantra does not make any illustration or guarantee regarding any of its users' item-specifics (such as legal title, creditworthiness, identity, etc.). You are encouraged to individually check the bona fides of any particular User that You pick to deal with on the Website and use Your best experience on that behalf.</li>
              <li>Batterymantra does not at any point of time when any transaction between Buyer and Seller on the Website come into or take ownership of any of the products or services proposed by Seller, nor does it at any point accumulation title to or have any rights or claims over the products or services offered by Seller to Buyer.</li>
              <li>At no time shall Batterymantra include any right, title, or interest over the products, nor shall Batterymantra have any responsibilities or liabilities regarding such agreement inserted into between Buyers and Sellers. Batterymantra is not liable for the offensive or delayed performance of services or losses due to out-of-stock, unavailable, or back-ordered products.</li>
              <li>The Website is only a platform that Users can use to reach a broader base to buy and sell products or services. Batterymantra is only providing a platform for communication. It is recognized that the agreement for the sale of any of the products or services shall be a rigorously bipartite agreement between the seller and the Buyer. At no time shall Batterymantra include any right, title, or interest over the products, nor shall Batterymantra have any responsibilities or obligations regarding such obligation. Batterymantra is not liable for services' unsatisfactory or delayed performance or damages or delays due to out-of-stock products, unavailable or back-ordered.</li>
              <li>You shall alone agree upon the use and terms and conditions of delivery, payment, insurance, etc., with the seller (s) that You accomplish with.</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg my-4 text-sm">
              <strong>Disclaimer:</strong> Pricing on any product(s) displayed on the Website may be due to some technical problem, typographical error, or product information issued by the seller may be inaccurately reflected, and in such an issue, the seller may remove such your order(s).
            </div>
            <ol start={9}>
              <li>You exempt and indemnify Batterymantra and any of its officers and agents from any cost, loss, liability, or another outcome of any of the actions of the Users of the Website and expressly reject any claims that you may have on this service under any applicable law. Notwithstanding its consistent efforts on that side, Batterymantra cannot take charge or control the information provided by other Users, which is made possible on the Website. You may see other users' information as offensive, dangerous, inconsistent, incorrect, or deceptive. Please use caution and follow safe trading when using the Website. Please note that there could be changes in dealing with underage persons or people acting under pretense.</li>
            </ol>
          </section>

          <section>
            <h2>Pricing</h2>
            <p>
              Prices for products are represented on our website and are included in these Terms by reference. All figures are Indian rupees. Prices, products, and services may vary at our preference.
            </p>
          </section>

          <section>
            <h2>Warranty and Product liability</h2>
            <p>
              Batterymantra.com shall not be kept responsible for any damaged goods or any injuries occurring from using any products. We do not give warranties on any battery (ies). The battery manufacturer (ies) is / are only liable for any obligations and warranty made on the battery. The information about batteries we give to our clients is limited to the data obtained from the free domain and third parties. All displayed batteries in our catalog may not be ready for sale due to the unavailability of the battery or any other purposes. The original color and dimension of the battery may change from the screen image.
            </p>
          </section>

          <section>
            <h2>Product Availability / Out of Stock</h2>
            <p>
              We make all efforts to update the stock of all products on our website, but our service's nature makes it extremely difficult to keep track of all product's stock at different locations in real-time. In some cases, products that are shown available may not be in stock. In such cases, our customer care team will inform you about the same via e-mail/phone. You may then pick any other alternative product or ready for the availability of the stock or remove your order. If you wish to cancel your order, then the amount paid by you (in the case of credit / debit card or net banking) will be refunded within five days of such cancellation. The refund will be made to the credit card or bank account you used for the purchase.
            </p>
            <p className="font-semibold mt-2">
              Note: The orders whose price will match our backend price only that order will be accepted.
            </p>
          </section>

          <section>
            <h2>Product Description</h2>
            <p>
              Batterymantra.com tries to be as accurate as possible. However, batterymantra.com does not warrant that the product description or other content of this site is accurate, complete, reliable, current, or error – free. If a product given by Batterymantra.com is not as specified, your sole solution is to return it in good condition.
            </p>
          </section>

          <section>
            <h2>Do not resell</h2>
            <p>
              You agree not to replicate, copy, duplicate, sell, exploit or resell for any commercial use, any part of the service, usage of the service, or access to the service.
            </p>
          </section>

          <section>
            <h2>Cancellation of order</h2>
            <p>
              Batterymantra.com reserves the right to cancel any order without any explanation for doing so, under situations where batterymantra.com cannot meet the order's requirement or order so placed/canceled does not comply with Batterymantra.com policy or for any other reason. However, Batterymantra.com will ensure that any communication of cancellation of an order, so canceled, is intimated within the appropriate time to the concerned person. Any appropriate refund will be done at the right time.
            </p>
          </section>

          <section>
            <h2>Governing Law</h2>
            <p>
              All of the laws mentioned above shall be administrated by and constructed in compliance with the laws of India without reference to conflict of laws values. Clashes arising in relation hereto shall be subject to the exclusive authority of the courts at Delhi.
            </p>
          </section>

          <section>
            <h2>Headings</h2>
            <p>
              All headings and subheadings mentioned on our website are included for convenience and identification only. They are not intended to describe, interpret, define or limit the scope, extent, or intent of the Terms or the right to use the website by you restricted herein or any other part or pages of the Website or any Linked Sites in any way whatsoever.
            </p>
          </section>

          <section>
            <h2>Interpretation of Number and Genders</h2>
            <p>
              This website's terms shall apply equally to both the singular and plural form of the terms defined. Whenever the circumstance may need, any pronoun shall include the corresponding masculine and feminine. The words "include," "includes," and "including" shall be believed to be followed by the phrase "without limitation." Unless the context otherwise requires, the terms "herein," "hereof," "hereto," "hereunder," and words of related import apply to the Terms as a mass.
            </p>
          </section>

          <section>
            <h2>Severability</h2>
            <p>
              Suppose any provision of the Terms is committed to being entirely or partly unacceptable or unenforceable. In that case, such unacceptability or unenforceability shall attach only to such condition or part of such condition. The left part of such condition and all other provisions of these Terms shall remain in full force and impact.
            </p>
          </section>

          <section>
            <h2>Report Abuse</h2>
            <p>
              Batterymantra.com doesn't review/check all content in any way before they become visible on the website of www.batterymantra.com. Batterymantra does not verify, support, or otherwise guarantee for the contents of any user or any content generally posted or uploaded on to the website of Batterymantra. You can be taken legally liable for their contents. You may be held legally accountable if their contents or body include, for example, nasty comments or material confined by copyright, trademark, etc. If you come across any abuse or violation of these Terms, please report to <a href="mailto:info@batterymantra.com" className="text-primary hover:underline">info@batterymantra.com</a>.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
