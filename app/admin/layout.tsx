"use client";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "./providers/AuthProviders";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <NextTopLoader color="#C16AFB" />
      {children}
      <Toaster />
    </AuthProvider>
  );
}
