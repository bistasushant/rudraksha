"use client";
import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Trash2, AlertCircle, ArrowRight } from "lucide-react";

import DialogBox from "@/components/DialogBox";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/language-context";
import { useCurrency } from "@/context/currency-context";
import {
  cartEnglishTexts,
  cartChineseTexts,
  cartHindiTexts,
  cartNepaliTexts,
} from "@/language";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CartPage() {
  const { selectedLanguage } = useLanguage();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { cartItems, removeItem, updateQuantity, totalPrice } = useCart();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  const cartTexts =
    selectedLanguage === "chinese"
      ? cartChineseTexts
      : selectedLanguage === "hindi"
      ? cartHindiTexts
      : selectedLanguage === "nepali"
      ? cartNepaliTexts
      : cartEnglishTexts;

  const handleConfirmRemove = () => {
    if (itemToRemove) removeItem(itemToRemove);
    setIsDialogVisible(false);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    updateQuantity(id, Math.max(1, newQuantity));
  };

  // Function to format currency based on selectedCurrency
  const formatCurrency = (amount: number) => {
    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      CNY: "¥",
      INR: "₹",
      NPR: "रु",
    };

    // Convert amount to selected currency
    const convertedAmount = amount * (exchangeRates[selectedCurrency] || 1);

    // Get currency symbol or default to the currency code
    const symbol = currencySymbols[selectedCurrency] || selectedCurrency;

    return `${symbol} ${convertedAmount.toFixed(2)}`;
  };

  const subtotal = totalPrice;
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-8 pt-20 flex-grow">
          {cartItems.length === 0 ? (
            <div className="text-center mt-8">
              <div className="max-w-md mx-auto">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h1 className="text-2xl font-bold mb-4">{cartTexts.h1}</h1>
                <Button asChild>
                  <Link href="/shop" className="text-xl">
                    {cartTexts.h2}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="lg:w-2/3 space-y-4 md:space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md p-4 md:p-6"
                  >
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start">
                      {/* Product Info */}
                      <div className="md:col-span-6 flex items-start space-x-4 w-full">
                        <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <Link
                            href={`/product/${item.id}`}
                            className="font-medium hover:text-primary line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <p className="text-gray-600 mt-1">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="md:col-span-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 justify-between md:justify-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-16 md:w-20 text-center h-8 md:h-10"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Price and Remove */}
                      <div className="md:col-span-3 w-full flex items-center justify-between md:justify-end">
                        <p className="font-medium md:text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 ml-2"
                          onClick={() => {
                            setItemToRemove(item.id);
                            setIsDialogVisible(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 md:mr-1" />
                          <span className="sr-only md:not-sr-only">
                            {cartTexts.h3}
                          </span>
                        </Button>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:sticky lg:top-24">
                  <h2 className="text-lg md:text-xl font-bold mb-4">
                    {cartTexts.h3}
                  </h2>
                  <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                    <div className="flex justify-between text-sm md:text-base">
                      <span>{cartTexts.subtotal}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm md:text-base">
                      <span>{cartTexts.shipping}</span>
                      <span>
                        {shipping === 0 ? "Free" : formatCurrency(shipping)}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <div className="text-xs md:text-sm text-gray-500 flex items-center">
                        <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        {cartTexts.h4}
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg md:text-xl">
                      <span>{cartTexts.total}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button className="w-full text-sm md:text-base" asChild>
                    <Link href="/checkout">
                      {cartTexts.h5}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogBox
            isVisible={isDialogVisible}
            message={cartTexts.h6}
            onClose={() => setIsDialogVisible(false)}
            onConfirm={handleConfirmRemove}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
