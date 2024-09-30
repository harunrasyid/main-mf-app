import React from "react";
import dynamic from "next/dynamic";
import { Footer, Navbar } from "@/components";

// @ts-ignore
const ProductsList = dynamic(() => import("profile_app/products"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

export default function index() {
  return (
    <main className="flex flex-col bg-white">
      <Navbar />
      <ProductsList />
      <Footer />
    </main>
  );
}
