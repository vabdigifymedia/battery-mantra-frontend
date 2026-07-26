import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { wishlistService } from "@/services/wishlist.service";
import type { ProductListResponse } from "@/types/dto";
import { toast } from "sonner";

interface WishlistContextType {
  items: ProductListResponse[];
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: ProductListResponse) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const LOCAL_STORAGE_KEY = "bm_wishlist_local";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [items, setItems] = useState<ProductListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist on mount / auth change
  useEffect(() => {
    async function loadWishlist() {
      setIsLoading(true);
      if (status === "authenticated" && user) {
        try {
          // Fetch from API
          const serverWishlist = await wishlistService.list();
          setItems(serverWishlist);
        } catch (error) {
          console.error("Failed to fetch server wishlist", error);
        }
      } else if (status === "unauthenticated") {
        // Fetch from local storage
        try {
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localData) {
            setItems(JSON.parse(localData));
          } else {
            setItems([]);
          }
        } catch (e) {
          console.error("Failed to parse local wishlist", e);
        }
      }
      setIsLoading(false);
    }

    if (status !== "loading") {
      loadWishlist();
    }
  }, [status, user]);

  // Persist to local storage if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated" && !isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, status, isLoading]);

  const isWishlisted = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  const toggleWishlist = async (product: ProductListResponse) => {
    const currentlyWishlisted = isWishlisted(product.productId);

    // Optimistic UI update
    if (currentlyWishlisted) {
      setItems((prev) => prev.filter((item) => item.productId !== product.productId));
    } else {
      setItems((prev) => [...prev, product]);
    }

    // Sync with backend if authenticated
    if (status === "authenticated") {
      try {
        if (currentlyWishlisted) {
          await wishlistService.remove(product.productId);
          toast.success("Removed from wishlist");
        } else {
          await wishlistService.add(product.productId);
          toast.success("Added to wishlist");
        }
      } catch (error) {
        // Revert on error
        toast.error("Failed to update wishlist");
        if (currentlyWishlisted) {
          setItems((prev) => [...prev, product]); // add back
        } else {
          setItems((prev) => prev.filter((item) => item.productId !== product.productId)); // remove
        }
      }
    } else {
      if (currentlyWishlisted) {
        toast.success("Removed from wishlist");
      } else {
        toast.success("Added to wishlist");
      }
    }
  };

  return (
    <WishlistContext.Provider value={{ items, isLoading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

