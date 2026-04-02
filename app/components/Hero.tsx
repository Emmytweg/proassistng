import { DotGlobeHero } from "@/components/ui/globe-hero";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProAssistHero() {
  return (
    <DotGlobeHero rotationSpeed={0.004}>
      <div className="text-center max-w-5xl mx-auto px-6 space-y-10">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Hire Trusted{" "}
          <span className="text-primary">Nigerian Freelancers</span> For Your
          Business
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          ProAssistNG connects businesses with vetted designers, developers,
          marketers, virtual assistants and writers ready to deliver
          high-quality work.
        </p>

        <div className="flex justify-center flex-wrap gap-6">
          <Link
            href="/browse-talents"
            className="flex items-center justify-center gap-2 w-64 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition"
          >
            Hire Talent
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/browse-talents"
            className="flex items-center justify-center gap-2 w-64 px-6 py-3 border rounded-lg font-medium hover:bg-muted transition"
          >
            Browse Freelancers
          </Link>
        </div>
      </div>
    </DotGlobeHero>
  );
}
