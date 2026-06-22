import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import TestimonialFormModal from "./TestimonialFormModal";

// Since this is a server component, we can fetch data directly
export default async function TestimonialsSection() {
  const supabase = getSupabaseServerClient();

  const { data: testimonials, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching testimonials:", error);
  }

  return (
    <section className="w-full py-16 md:py-24 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              What Our Clients Say
            </h2>
            <p className="max-w-[700px] text-neutral-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-neutral-400 mx-auto">
              Hear from the businesses and individuals who have successfully worked with our top-tier freelancers.
            </p>
          </div>
          <div className="pt-4">
            <TestimonialFormModal />
          </div>
        </div>

        {testimonials && testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-neutral-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 italic">
                    "{testimonial.content}"
                  </p>
                </div>
                <div className="mt-6">
                  <p className="font-semibold">{testimonial.name}</p>
                  {testimonial.role && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {testimonial.role}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            No reviews yet. Be the first to drop one!
          </div>
        )}
      </div>
    </section>
  );
}
