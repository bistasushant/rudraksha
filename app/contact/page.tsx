"use client";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/language-context";
import Image from "next/image";

import {
  contactEnglishTexts,
  contactChineseTexts,
  contactHindiTexts,
  contactNepaliTexts,
} from "@/language";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ContactDetails {
  address?: string;
  email?: string;
  phone?: string;
  mapEmbedUrl?: string;
}

export default function Contact() {
  const { selectedLanguage } = useLanguage();
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch contact details from API
    const fetchContactDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/sitesetting/contact");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch contact details: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log(data);
        console.log("Fetched contact details:", data); // Debug log
        if (data?.data) {
          setContactDetails({
            address: data.data.address,
            email: data.data.email,
            phone: data.data.phone,
            mapEmbedUrl: data.data.mapEmbedUrl,
          });
        } else {
          console.warn("No contact details found in API response");
          setContactDetails({});
        }
      } catch (err) {
        console.error("Error fetching contact details:", err);
        setError((err as Error).message || "Failed to fetch contact details");
        setContactDetails({});
      } finally {
        setLoading(false);
      }
    };

    fetchContactDetails();
  }, []);

  const contactTexts =
    selectedLanguage === "chinese"
      ? contactChineseTexts
      : selectedLanguage === "hindi"
      ? contactHindiTexts
      : selectedLanguage === "nepali"
      ? contactNepaliTexts
      : contactEnglishTexts;

  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/Asthetic-contact.png"
              alt="Contact Us"
              fill
              priority
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
              {contactTexts.h1}
            </h1>
            <p className="mb-8 max-w-2xl text-lg md:text-xl">
              {contactTexts.h2}
            </p>
          </div>
        </div>

        {/* Contact Content */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-lg text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-6 text-center">
                <p className="text-red-600">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                    <Send className="text-primary" />
                    {contactTexts.h3}
                  </h2>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-lg mb-2">
                        {contactTexts.h4}
                      </label>
                      <Input
                        type="text"
                        placeholder={contactTexts.h17}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-lg mb-2">
                        {contactTexts.h5}
                      </label>
                      <Input
                        type="email"
                        placeholder={contactTexts.h18}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-lg mb-2">
                        {contactTexts.h6}
                      </label>
                      <Textarea
                        placeholder={contactTexts.h19}
                        className="h-32 text-lg"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 h-12 text-lg mt-2"
                    >
                      {contactTexts.sendMessage}
                    </Button>
                  </form>
                </div>

                {/* Contact Info */}
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                      <MapPin className="text-primary" />
                      {contactTexts.h14}
                    </h2>
                    {contactDetails?.address ? (
                      <p className="text-gray-600">{contactDetails.address}</p>
                    ) : (
                      <p className="text-gray-400">No Data</p>
                    )}
                    {contactDetails?.mapEmbedUrl ? (
                      <div className="aspect-video rounded-lg overflow-hidden mt-4">
                        <iframe
                          src={contactDetails.mapEmbedUrl}
                          className="w-full h-full"
                          loading="lazy"
                          allowFullScreen
                          title="Company Location"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>
                    ) : (
                      <p className="text-gray-400 mt-4">No Map Available</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Phone className="text-primary" />
                        <h3 className="text-xl font-semibold">
                          {contactTexts.phone}
                        </h3>
                      </div>
                      {contactDetails?.phone ? (
                        <p className="text-gray-600">{contactDetails.phone}</p>
                      ) : (
                        <p className="text-gray-400">No Data</p>
                      )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Mail className="text-primary" />
                        <h3 className="text-xl font-semibold">
                          {contactTexts.email}
                        </h3>
                      </div>
                      {contactDetails?.email ? (
                        <p className="text-gray-600">{contactDetails.email}</p>
                      ) : (
                        <p className="text-gray-400">No Data</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
