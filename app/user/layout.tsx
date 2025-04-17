import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <NextTopLoader color="#9E9E9E" />
      {children}
      <Toaster />
      <Footer />
    </>
  );
}
