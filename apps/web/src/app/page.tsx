import Nav from "@/features/landing/components/Nav";
import Hero from "@/features/landing/components/Hero";
import { LiveTicker } from "@/features/landing/components/LiveTicker";
import { Halt } from "@/features/landing/components/Halt";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Product } from "@/features/landing/components/Product";
import { Proof } from "@/features/landing/components/Proof";
import { TryIt } from "@/features/landing/components/TryIt";
import { Faq } from "@/features/landing/components/Faq";
import Footer from "@/features/landing/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Nav />
      <main>
        <Hero />
        <LiveTicker />
        <Halt />
        <HowItWorks />
        <Product />
        <Proof />
        <TryIt />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
