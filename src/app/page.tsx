"use client";

import { useEffect, useRef, useState } from "react";
import Topbar from "./Topbar";

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

function formatCount(value: number, decimals: number) {
  if (decimals > 0) return value.toFixed(decimals);
  return Math.floor(value).toLocaleString();
}

function Counter({
  target,
  decimals = 0,
  suffix = "",
  duration = 2200,
  trigger,
}: {
  target: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  trigger: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    let raf: number;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic: fast start, slows down as it nears the target
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [trigger, target, duration]);

  return (
    <>
      {formatCount(value, decimals)}
      {suffix}
    </>
  );
}

const FEATURES: {
  title: string;
  description: string;
  systems: string[];
}[] = [
  {
    title: "Advanced Powerful Panel",
    description:
      "A clean, intuitive dashboard that puts every setting, server, and log in one place, so you can manage everything without digging through menus.",
    systems: ["Modmail", "Pterodactyl"],
  },
  {
    title: "Quick & Friendly Support",
    description: "Connect to real humans in a matter of minutes.",
    systems: ["Modmail", "Pterodactyl"],
  },
  {
    title: "24/7 Hosting",
    description:
      "Your bot and servers stay online around the clock on infrastructure we monitor continuously, so you don't have to.",
    systems: ["Modmail", "Pterodactyl"],
  },
  {
    title: "99.99% Uptime Guaranteed",
    description:
      "Built on redundant infrastructure so your services stay online almost all the time, with monitoring in place to catch and resolve issues fast.",
    systems: ["Modmail", "Pterodactyl"],
  },
  {
    title: "High Configuration",
    description:
      "Fine-tune categories, permissions, embeds, and responses to match exactly how your server's support flow should work.",
    systems: ["Modmail"],
  },
  {
    title: "Github Modmail",
    description:
      "Our modmail bot is fully open-source on GitHub, so you can review the code, suggest features, or self-host it yourself.",
    systems: ["Modmail"],
  },
  {
    title: "Free Server Backups",
    description:
      "Automatic backups of your Pterodactyl servers are included at no extra cost, so you can restore quickly if anything goes wrong.",
    systems: ["Pterodactyl"],
  },
  {
    title: "High Specifications",
    description:
      "Servers run on strong CPU and NVMe storage allocations, giving your game servers and bots plenty of headroom.",
    systems: ["Pterodactyl"],
  },
];

export default function Home() {
  const [word, setWord] = useState(0);
  // 0: none, 1: "Hosting", 2: +"Made", 3: +"Simple" (holds 5s, then resets)

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cycle = () => {
      if (cancelled) return;
      setWord(1);
      timers.push(
        setTimeout(() => {
          setWord(2);
          timers.push(
            setTimeout(() => {
              setWord(3);
              timers.push(
                setTimeout(() => {
                  setWord(0);
                  timers.push(setTimeout(cycle, 400));
                }, 5000)
              );
            }, 500)
          );
        }, 500)
      );
    };

    cycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const offer = useInView<HTMLDivElement>();
  const stats = useInView<HTMLDivElement>();

  // Refs used purely for smooth-scrolling from one section to the next.
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const offerSectionRef = useRef<HTMLElement | null>(null);
  const statsSectionRef = useRef<HTMLElement | null>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Back-to-top button only appears once the visitor has actually scrolled
  // down, so it never crowds the hero.
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "DH Hosting";
  }, []);

  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* Continuous grid background, fixed so it covers the whole page as you scroll */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
        }}
      />

      <Topbar />

      <div className="relative z-10">
        {/* Hero */}
        <section ref={heroSectionRef} className="relative min-h-screen">
          <div className="relative flex flex-col lg:flex-row min-h-screen items-center px-6 md:px-16 pt-24 gap-8">
            <div className="flex flex-col justify-center shrink-0 lg:w-[480px] xl:w-[540px]">
              <h1
                className="float-anim text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight whitespace-nowrap"
                style={{ textShadow: "5px 7px 20px rgba(91,33,182,0.35)" }}
              >
                DH Hosting
              </h1>

              <p
                className="mt-6 text-2xl md:text-3xl font-medium text-white/70 flex flex-wrap gap-x-3"
                style={{ textShadow: "3px 5px 14px rgba(91,33,182,0.28)" }}
              >
                <span
                  className={`transition-opacity duration-500 ${
                    word >= 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Hosting
                </span>
                <span
                  className={`transition-opacity duration-500 ${
                    word >= 2 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Made
                </span>
                <span
                  className={`transition-opacity duration-500 ${
                    word >= 3 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Simple.
                </span>
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <FeatureChip>Free of charge</FeatureChip>
                <FeatureChip>Setup In Matter of Minutes.</FeatureChip>
                <FeatureChip>No Subscriptions No Ads</FeatureChip>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <PurpleButton
                  href="https://discord.gg/wxAj6WtGQw"
                  external
                  icon={<DiscordIcon className="w-5 h-5" />}
                >
                  Join Discord
                </PurpleButton>
                <PurpleButton href="#" icon={<InfoIcon className="w-5 h-5" />}>
                  View More Information
                </PurpleButton>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch w-full lg:w-[680px]">
              <MiniCard
                icon={<MailIcon className="w-12 h-12 text-violet-500" />}
                title="Discord Modmail Host"
                description="One free modmail bot, guaranteed to run 24/7. Support moves out of a cluttered ticket channel and into private DMs."
              />

              <div className="hidden sm:block w-px mx-6 bg-white/20" />

              <MiniCard
                icon={<ServerIcon className="w-12 h-12 text-violet-500" />}
                title="Pterodactyl Host"
                description="A completely free Pterodactyl panel, always. Create Discord bots, host websites, and run game servers, all in one place."
              />
            </div>
          </div>

          <SectionScrollButton
            onClick={() => scrollToSection(offerSectionRef)}
          />
        </section>

        {/* What We Offer & Our Features */}
        <section
          ref={offerSectionRef}
          id="features"
          className="relative px-6 md:px-16 py-24 border-t border-white/10"
        >
          <div
            ref={offer.ref}
            className={`transition-all duration-700 ${
              offer.inView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-left mb-10">
                What We Offer & Our Features
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <OfferCard
                  icon={<MailIcon className="w-10 h-10 text-violet-500" />}
                  title="Discord Modmail Host"
                  description="One free modmail bot, guaranteed to run 24/7. Support moves out of a cluttered ticket channel and into private threads."
                  buttonHref="https://modmail.dhmodmail.co.uk"
                />

                <OfferCard
                  icon={<ServerIcon className="w-10 h-10 text-violet-500" />}
                  title="Pterodactyl Host"
                  description="A completely free Pterodactyl panel, always. Create Discord bots, host websites, and run game servers, all in one place."
                  buttonHref="https://panel.dhmodmail.co.uk"
                />
              </div>

              <h3 className="mt-16 text-2xl md:text-3xl font-semibold text-left mb-8">
                Our Features
              </h3>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <GhostViewMoreButton
              onClick={() => scrollToSection(statsSectionRef)}
            />
          </div>
        </section>

        {/* Live Statistics */}
        <section ref={statsSectionRef} className="relative px-6 md:px-16 py-24 border-t border-white/10">
          <div
            ref={stats.ref}
            className={`transition-all duration-700 ${
              stats.inView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-left mb-16">
                Live Statistics
              </h2>

              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <StatBlock label="Total Servers Ever Made">
                  <Counter target={1240} suffix="+" trigger={stats.inView} />
                </StatBlock>
                <StatBlock label="Total Accounts Ever Made">
                  <Counter target={3580} suffix="+" trigger={stats.inView} />
                </StatBlock>
                <StatBlock label="Total Discord Members">
                  <Counter target={12400} suffix="+" trigger={stats.inView} />
                </StatBlock>
                <StatBlock label="Uptime">
                  <Counter
                    target={99.99}
                    decimals={2}
                    suffix="%"
                    duration={2800}
                    trigger={stats.inView}
                  />
                </StatBlock>
              </div>
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="relative px-6 md:px-16 py-24 border-t border-white/10">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold">Ready to host?</h2>
            <p className="mt-4 text-lg text-white/60">
              We're ready when you are. You're a click away.
            </p>
            <div className="mt-8 flex justify-center">
              <PurpleButton
                href="https://discord.gg/wxAj6WtGQw"
                external
                icon={<DiscordIcon className="w-5 h-5" />}
              >
                Join Discord
              </PurpleButton>
            </div>
          </div>
        </section>
      </div>

      {/* Floating back-to-top button, tucked in the corner so it never covers content */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-violet-700/50 bg-black/70 backdrop-blur px-4 py-2.5 text-sm font-medium text-white/80 shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:border-violet-500 hover:text-white hover:-translate-y-0.5 ${
          showBackToTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <ArrowUpIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Back to top</span>
      </button>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <style jsx>{`
        @keyframes floatY {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .float-anim {
          animation: floatY 4.5s ease-in-out infinite;
        }

        @keyframes bounceY {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }
        .bounce-anim {
          animation: bounceY 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}

function StatBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-violet-700/50 bg-violet-900/10 p-8 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet-500 hover:shadow-[0_0_30px_rgba(91,33,182,0.3)]">
      <div className="text-4xl md:text-5xl font-bold text-violet-400 tabular-nums">
        {children}
      </div>
      <p className="mt-3 text-sm text-white/60">{label}</p>
    </div>
  );
}

function FeatureChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-700/60 px-4 py-1.5 text-sm text-white/80">
      <CheckIcon className="w-4 h-4 text-violet-500 shrink-0" />
      {children}
    </span>
  );
}

function PurpleButton({
  href,
  icon,
  children,
  external = false,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-2 rounded-lg bg-violet-800 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform duration-300 ease-out hover:scale-105 hover:bg-violet-700"
    >
      {icon}
      {children}
    </a>
  );
}

// Small scroll-cue used at the foot of the hero. Sits right at the edge of
// the viewport so it reads as a hint rather than another call to action.
function SectionScrollButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="View more"
      className="bounce-anim absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-violet-700/50 bg-black/50 backdrop-blur px-4 py-2 text-xs font-medium text-white/60 transition-colors duration-300 hover:border-violet-500 hover:text-white"
    >
      View More
      <ChevronDownIcon className="w-3.5 h-3.5" />
    </button>
  );
}

// Same idea, used inline between sections rather than pinned to the
// viewport edge, so it stays out of the way of the grid above it.
function GhostViewMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-violet-700/40 px-5 py-2 text-sm font-medium text-white/50 transition-all duration-300 ease-out hover:border-violet-500 hover:text-white hover:-translate-y-0.5"
    >
      View More
      <ChevronDownIcon className="w-4 h-4" />
    </button>
  );
}

function MiniCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex-1 rounded-2xl border border-violet-700/50 bg-violet-900/10 p-6 min-h-[220px] flex flex-col items-center justify-center text-center transition-all duration-300 ease-out hover:-translate-y-2 hover:border-violet-500 hover:shadow-[0_0_35px_rgba(91,33,182,0.4)]">
      <div className="absolute top-4 left-4">
        <AvailableBadge />
      </div>

      {icon}
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-xs">
        {description}
      </p>

      <PurpleButton href="#" icon={<InfoIcon className="w-4 h-4" />}>
        <span className="text-sm">View More Information</span>
      </PurpleButton>
    </div>
  );
}

function OfferCard({
  icon,
  title,
  description,
  buttonHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonHref: string;
}) {
  return (
    <div className="relative rounded-2xl border border-violet-700/50 bg-violet-900/10 p-5 flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet-500 hover:shadow-[0_0_35px_rgba(91,33,182,0.35)]">
      <div className="flex items-center gap-2 mb-3">
        <AvailableBadge />
        <RequiresAccountBadge />
      </div>

      <div className="flex items-start gap-4">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            {description}
          </p>
        </div>
      </div>

      <a
        href={buttonHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex self-start items-center gap-2 rounded-lg bg-violet-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform duration-300 ease-out hover:scale-105 hover:bg-violet-700"
      >
        Go To Panel
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  systems,
}: {
  title: string;
  description: string;
  systems: string[];
}) {
  return (
    <div className="relative rounded-2xl border border-violet-700/50 bg-violet-900/10 p-6 flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet-500 hover:shadow-[0_0_30px_rgba(91,33,182,0.3)]">
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        {systems.map((system) => (
          <span
            key={system}
            className="rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[11px] text-white/60"
          >
            {system}
          </span>
        ))}
      </div>

      <h3 className="mt-8 text-lg font-semibold text-left">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60 flex-1 text-left">
        {description}
      </p>
    </div>
  );
}

function AvailableBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-violet-700/40 bg-black/60 px-2.5 py-1">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
      <span className="text-xs font-medium text-white/80">Available</span>
    </span>
  );
}

function RequiresAccountBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-white/20 bg-black/60 px-2.5 py-1">
      <WarningIcon className="w-3.5 h-3.5 text-yellow-400" />
      <span className="text-xs font-medium text-white/70">
        Requires Account
      </span>
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}