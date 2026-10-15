import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { WishlistTab } from "@/components/account/WishlistTab";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () =>
    buildPageHead(undefined, {
      title: "My Wishlist — BatteryMantra",
      description: "View and manage your saved and favorited batteries.",
    }),
  component: WishlistPage,
});

function WishlistPage() {
  return (
    <div className="min-h-[60vh] py-6 sm:py-8">
      <Container size="xl">
        <PageHeader
          title="My Wishlist"
          description="Your favorited batteries for quick access and checkout."
        />
        <div className="mt-6">
          <WishlistTab />
        </div>
      </Container>
    </div>
  );
}
