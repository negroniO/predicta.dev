"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

type FeaturedProject = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  tags: string[] | null;
  coverImageUrl: string | null;
  // extra fields if you want them later:
  category?: string | null;
  year?: number | string | null;
  views?: number | null;
  reactions?: number | null;
};

const AUTO_DELAY_MS = 5000;

export default function FeaturedCarousel({
  projects,
}: {
  projects: FeaturedProject[];
}) {
  if (!projects.length) return null;

  return (
    <div className="relative select-none">
      <Swiper
        modules={[Autoplay, Pagination, Keyboard]}
        slidesPerView={1}
        loop={projects.length > 1}
        autoplay={{
          delay: AUTO_DELAY_MS,
          disableOnInteraction: false, // keeps autoplay even after swiping
          pauseOnMouseEnter: true,
        }}
        keyboard={{ enabled: true }}
        speed={850} // smooth transition
        pagination={{ clickable: true }} // dots
        className="w-full pb-8" // space for dots
      >
        {projects.map((project, idx) => (
          <SwiperSlide key={project.id} className="flex justify-center">
            <article
              className="group w-full max-w-xl h-[276px] md:h-[280px] flex flex-col rounded-xl border border-card-border/80 bg-card/80 backdrop-blur-xl shadow-[0_10px_30px_-18px_rgba(34,211,238,0.25)] transition transform hover:-translate-y-0.5 hover:shadow-[0_15px_50px_-16px_rgba(34,211,238,0.35)] overflow-hidden"
            >
              {/* Image + overlay header */}
              <div className="relative h-32 md:h-32 w-full overflow-hidden rounded-t-xl flex-shrink-0">
                {project.coverImageUrl ? (
                  <Image
                    src={project.coverImageUrl}
                    alt={project.subtitle || project.description || project.title}
                    fill
                    sizes="(min-width: 768px) 640px, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={idx === 0}
                  />
                ) : (
                  <div
                    aria-hidden
                    className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                {/* Floating title */}
                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end gap-2">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-semibold text-slate-50 line-clamp-1">
                      {project.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                      {project.category && (
                        <span className="rounded-full border border-slate-600/60 bg-slate-900/70 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          {project.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-3 flex flex-col flex-1 gap-2">
                <p className="text-[13px] text-slate-300 line-clamp-2 min-h-[24px]">
                  {project.subtitle || project.description}
                </p>

                {project.tags && project.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] max-h-[22px] overflow-hidden">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full border border-slate-700/70 bg-slate-900/60 text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex-1" />

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Link
                    href={`/projects/${project.slug}`}
                    prefetch={idx < 3}
                    className="btn btn-section btn-sm"
                  >
                    View case study
                  </Link>
                </div>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
