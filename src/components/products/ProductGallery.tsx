import { Image } from "@/components/common/Image";

type Props = {
  primaryImage?: string;
  alt: string;
};

export function ProductGallery({ primaryImage, alt }: Props) {
  return (
    <div className="space-y-3">
      <Image src={primaryImage} alt={alt} aspect="square" className="border border-border" />
    </div>
  );
}
