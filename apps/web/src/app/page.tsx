import Nav from "@/features/landing/components/Nav";
import Hero from "@/features/landing/components/Hero";
import { GuardStory } from "@/features/landing/components/GuardStory";
import { PlatformShowcase } from "@/features/landing/components/PlatformShowcase";
import { Security } from "@/features/landing/components/Security";
import { DeployAgents } from "@/features/landing/components/DeployAgents";
import Footer from "@/features/landing/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />
      <Hero />
      <GuardStory />
      <PlatformShowcase />
      <Security />
      <DeployAgents />
      <Footer />
    </div>
  );
}
