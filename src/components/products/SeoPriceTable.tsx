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
                const specCap = (product as any).specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('capacity'))?.value;
                if (specCap) return specCap;
                
                const match = name.match(/(\d+)\s*(Ah|AH|ah)/i);
                if (match) return match[0].toUpperCase();
                
                if (backendCapacity && /^(R\/L|L\/R|R|L)$/i.test(backendCapacity.trim())) {
                  return "N/A";
                }
                
                return backendCapacity || "N/A";
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
                    {(product as any).specDetails?.find((s: any) => s.attributeName?.toLowerCase().includes('warranty'))?.value || "Standard Warranty"}
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
