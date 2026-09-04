import type { ProductListResponse } from "@/types/dto";

interface SeoPriceTableProps {
  products: ProductListResponse[];
  title: string;
}

export function SeoPriceTable({ products, title }: SeoPriceTableProps) {
  if (!products || products.length === 0) return null;

  // Take up to 10 products for the table
  const tableProducts = products.slice(0, 10);

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#008000] text-white">
            <tr>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Product Name</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Capacity</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Warranty</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Price Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tableProducts.map((product, index) => {
              const priceWithExchange = Math.max(0, product.productPrice - (product.exchangeDiscount || 0));
              const priceWithoutExchange = product.productPrice;
              
              const priceRange = priceWithExchange !== priceWithoutExchange 
                ? `₹${priceWithExchange.toLocaleString('en-IN')} - ₹${priceWithoutExchange.toLocaleString('en-IN')}`
                : `₹${priceWithoutExchange.toLocaleString('en-IN')}`;

              const extractCapacity = (name: string, backendCapacity?: string) => {
                if ('capacityAh' in product && (product as any).capacityAh) {
                  return (product as any).capacityAh;
                }
                let specCap = (product as any).specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('capacity'))?.value;
                if (!specCap && (product as any).specs) {
                  const specsObj = (product as any).specs;
                  const capKey = Object.keys(specsObj).find(k => k.toLowerCase().includes('capacity') || k.toLowerCase() === 'ah');
                  if (capKey) specCap = specsObj[capKey];
                }
                if (specCap) return String(specCap);
                
                // Try to find explicitly mentioned Ah
                const ahMatch = name.match(/(\d+)\s*(Ah|AH|ah)/i);
                if (ahMatch) return ahMatch[0].toUpperCase();
                
                // Try to find DIN formats (e.g. DIN100, DIN-100)
                const dinMatch = name.match(/DIN-?(\d+)/i);
                if (dinMatch) return `${dinMatch[1]} AH`;
                
                // Hide layout-only values returned by backend
                if (backendCapacity && /^(R\/L|L\/R|RL|LR|R|L)$/i.test(backendCapacity.trim())) {
                  return "N/A";
                }
                
                return backendCapacity || "N/A";
              };

              const extractWarranty = (name: string) => {
                let specWar = (product as any).specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('warranty'))?.value;
                if (!specWar && (product as any).specs) {
                  const specsObj = (product as any).specs;
                  const warKey = Object.keys(specsObj).find(k => k.toLowerCase().includes('warranty') || k.toLowerCase().includes('guarantee'));
                  if (warKey) specWar = specsObj[warKey];
                }
                if (specWar) return String(specWar);
                
                // Try to extract from product name
                const warrantyMatch = name.match(/(\d+)\s*(Month|Months|Year|Years)\s*(Warranty|Guarantee)?/i);
                if (warrantyMatch) {
                  let text = warrantyMatch[0].trim();
                  // Normalize "Months" -> "Months Warranty" for better display if not present
                  if (!/warranty|guarantee/i.test(text)) {
                    text += " Warranty";
                  }
                  return text;
                }
                
                return "Standard Warranty";
              };

              return (
                <tr 
                  key={product.productId} 
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="px-4 py-3 text-foreground font-medium">{product.productName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {extractCapacity(product.productName, product.capacity)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {extractWarranty(product.productName)}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">{priceRange}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
