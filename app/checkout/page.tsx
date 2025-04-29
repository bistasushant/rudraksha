"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"; // Import custom Card components
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Function to parse latitude and longitude from a map URL
const parseMapUrl = (url: string): { lat: string; lng: string } | null => {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes("google.com")) {
      const pathMatch = urlObj.pathname.match(
        /@([-.\d]+),([-.\d]+),(\d+\.?\d*z)/
      );
      if (pathMatch) {
        return { lat: pathMatch[1], lng: pathMatch[2] };
      }
      const queryMatch = urlObj.search.match(/q=([-.\d]+),([-.\d]+)/);
      if (queryMatch) {
        return { lat: queryMatch[1], lng: queryMatch[2] };
      }
    }

    if (urlObj.hostname.includes("apple.com")) {
      const llMatch = urlObj.search.match(/ll=([-.\d]+),([-.\d]+)/);
      if (llMatch) {
        return { lat: llMatch[1], lng: llMatch[2] };
      }
    }

    if (urlObj.hostname.includes("openstreetmap.org")) {
      const latMatch = urlObj.search.match(/mlat=([-.\d]+)/);
      const lonMatch = urlObj.search.match(/mlon=([-.\d]+)/);
      if (latMatch && lonMatch) {
        return { lat: latMatch[1], lng: lonMatch[1] };
      }
      const hashMatch = urlObj.hash.match(/#map=\d+\/([-.\d]+)\/([-.\d]+)/);
      if (hashMatch) {
        return { lat: hashMatch[1], lng: hashMatch[2] };
      }
    }

    return null;
  } catch (error) {
    console.log(error);
    throw new Error();
  }
};

export default function Checkout() {
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    null
  );
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [locationUrl, setLocationUrl] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    lat: string;
    lng: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Error state for form validation

  const router = useRouter();
  const { clearCart } = useCart(); // Use cart context to clear items

  // Handle URL input and parsing
  const handleLocationUrlChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const url = e.target.value.trim();
    setLocationUrl(url);
    setCoordinates(null);
    setLocationError(null);

    if (url) {
      const parsed = parseMapUrl(url);
      if (parsed) {
        setCoordinates(parsed);
      } else {
        setLocationError(
          "Invalid map URL. Please provide a valid Google Maps, Apple Maps, or OpenStreetMap link."
        );
      }
    }
  };

  // Open the location in a new tab
  const handleViewLocation = () => {
    if (coordinates) {
      const googleMapsUrl = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},15z`;
      window.open(googleMapsUrl, "_blank");
    } else if (locationUrl) {
      window.open(locationUrl, "_blank");
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state

    if (selectedPaymentType === "cod") {
      // Cash on Delivery: Show toast, clear cart, and redirect immediately
      toast.success("Your order has been placed", {
        position: "top-right",
        duration: 2000, // Reduced duration for faster feedback
      });
      clearCart(); // Clear the cart
      router.push("/shop"); // Redirect to shop ASAP
    } else if (selectedPaymentType === "online" && selectedGateway) {
      // Online Payment: Open respective gateway website
      if (selectedGateway === "esewa") {
        window.open("https://esewa.com.np/", "_blank");
      } else if (selectedGateway === "khalti") {
        window.open("https://khalti.com/", "_blank");
      } else if (selectedGateway === "himalaya") {
        window.open("https://www.himalayanbank.com/", "_blank");
      }
    } else {
      // No payment method selected or incomplete online payment
      setError("Please select a payment method and gateway (if online).");
    }
  };

  return (
    <>
      <Header />
      <section className="min-h-screen bg-gradient-to-br from-gray-800 to-white flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Shipping Details */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl">Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Your Email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Address
                    </label>
                    <textarea
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      rows={4}
                      placeholder="Enter your full address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      PinPoint Location (Optional)
                    </label>
                    <div className="flex flex-col gap-2">
                      <textarea
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        rows={2}
                        placeholder="Paste the URL of your exact location (e.g., Google Maps)"
                        value={locationUrl}
                        onChange={handleLocationUrlChange}
                      />
                      {coordinates && (
                        <p className="text-sm text-green-600">
                          Latitude: {coordinates.lat}, Longitude:{" "}
                          {coordinates.lng}
                        </p>
                      )}
                      {locationError && (
                        <p className="text-sm text-red-600">{locationError}</p>
                      )}
                      {(locationUrl || coordinates) && (
                        <button
                          type="button"
                          onClick={handleViewLocation}
                          className="self-start bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                          View Location
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="Your City"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="+977 "
                        required
                      />
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="text-red-600">{error}</p> // Display error message
                )}
              </form>
            </CardContent>
          </Card>

          {/* Right Side - Payment Options */}
          <div className="space-y-8">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-3xl">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cash on Delivery */}
                <div
                  onClick={() => {
                    setSelectedPaymentType("cod");
                    setSelectedGateway(null);
                  }}
                  className={`group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                    selectedPaymentType === "cod"
                      ? "border-green-500 bg-green-50/50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        selectedPaymentType === "cod"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      } group-hover:bg-green-100 transition-colors`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Cash on Delivery
                      </h3>
                      <p className="text-sm text-gray-500">
                        Pay when you receive the item
                      </p>
                    </div>
                    {selectedPaymentType === "cod" && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Online Payment */}
                <div
                  onClick={() => setSelectedPaymentType("online")}
                  className={`group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                    selectedPaymentType === "online"
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        selectedPaymentType === "online"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      } group-hover:bg-blue-100 transition-colors`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Online Payment
                      </h3>
                      <p className="text-sm text-gray-500">
                        Secure instant payment
                      </p>
                    </div>
                    {selectedPaymentType === "online" && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Online Payment Gateways */}
                  {selectedPaymentType === "online" && (
                    <div className="space-y-4 mt-6 ml-14">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGateway("esewa");
                        }}
                        className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${
                          selectedGateway === "esewa"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-400"
                        }`}
                      >
                        <Image
                          src="/images/esewa.png"
                          alt="Esewa"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg"
                        />
                        <span className="font-medium text-gray-800">Esewa</span>
                        {selectedGateway === "esewa" && (
                          <div className="ml-auto w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGateway("khalti");
                        }}
                        className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${
                          selectedGateway === "khalti"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-500"
                        }`}
                      >
                        <Image
                          src="/images/khalti.png"
                          alt="Khalti"
                          width={40}
                          height={40}
                          className="w-12 h-12 rounded-lg"
                        />
                        <span className="font-medium text-gray-800">
                          Khalti
                        </span>
                        {selectedGateway === "khalti" && (
                          <div className="ml-auto w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGateway("himalaya");
                        }}
                        className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${
                          selectedGateway === "himalaya"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-red-400"
                        }`}
                      >
                        <Image
                          src="/images/Himlayanicon.png"
                          alt="Himalaya Bank"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg"
                        />
                        <span className="font-medium text-gray-800">
                          Himalaya Bank
                        </span>
                        {selectedGateway === "himalaya" && (
                          <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="justify-center">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
                >
                  Submit Order
                </button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
