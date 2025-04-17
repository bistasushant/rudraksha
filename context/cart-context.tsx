"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage, LanguageKey } from "@/context/language-context";
import {
  cartcontextEnglishTexts,
  cartcontextChineseTexts,
  cartcontextHindiTexts,
  cartcontextNepaliTexts,
} from "@/language";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const { selectedLanguage } = useLanguage(); // Removed setSelectedLanguage since it's not used

  const cartcontextTexts =
    selectedLanguage === "chinese"
      ? cartcontextChineseTexts
      : selectedLanguage === "hindi"
      ? cartcontextHindiTexts
      : selectedLanguage === "nepali"
      ? cartcontextNepaliTexts
      : cartcontextEnglishTexts;

  // Single initialization from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("rudraksha-cart");
    setCartItems(savedCart ? JSON.parse(savedCart) : []);
  }, []);

  // Unified cart persistence and calculation
  useEffect(() => {
    localStorage.setItem("rudraksha-cart", JSON.stringify(cartItems));
    const newTotal = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const newPrice = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setTotalItems(newTotal);
    setTotalPrice(newPrice);
  }, [cartItems]);

  // Debounced add to cart with single toast
  const addItem = (item: CartItem) => {
    setCartItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        toast.error(cartcontextTexts.h1, {
          description: `${item.name} ${cartcontextTexts.h2}`,
        });
        return prev;
      }
      toast.success(cartcontextTexts.h3, {
        description: `${item.name} ${cartcontextTexts.h4}`,
      });
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Remove with confirmation
  const removeItem = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      toast.success(cartcontextTexts.h5, {
        description: cartcontextTexts.h6,
      });
      return updated;
    });
  };

  // Quantity update with bounds check
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return removeItem(id);

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("rudraksha-cart");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
