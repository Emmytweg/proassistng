import Image from "next/image";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustedBy from "./components/FeaturedFreelancers";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import WhyChoose from "./components/WhyChoose";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
export default function Home() {
  return (
    <div className="">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Services />
      <HowItWorks />
      <WhyChoose />
      <CTASection />
      <Footer />
    </div>
  );
}
