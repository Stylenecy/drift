import Nav from "@/features/landing/components/Nav";
import Hero from "@/features/landing/components/Hero";
import { LiveTicker } from "@/features/landing/components/LiveTicker";
import { Halt } from "@/features/landing/components/Halt";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Proof } from "@/features/landing/components/Proof";
import { Ask } from "@/features/landing/components/Ask";
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
        <Proof />
        <Ask />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
