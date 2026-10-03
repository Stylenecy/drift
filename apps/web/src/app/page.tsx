import Nav from "@/features/landing/components/Nav";
import Hero from "@/features/landing/components/Hero";
import { LiveTicker } from "@/features/landing/components/LiveTicker";
import { Proof } from "@/features/landing/components/Proof";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Halt } from "@/features/landing/components/Halt";
import { Engine } from "@/features/landing/components/Engine";
import { Limits } from "@/features/landing/components/Limits";
import Footer from "@/features/landing/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Nav />
      <main>
        <Hero />
        <LiveTicker />
        <Proof />
        <HowItWorks />
        <Halt />
        <Engine />
        <Limits />
      </main>
      <Footer />
    </div>
  );
}
