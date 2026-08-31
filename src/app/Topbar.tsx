"use client";

const LOGO_URL = "/logo.svg";

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  disabled?: boolean;
  variant?: "link" | "outline" | "solid";
};

// Status and Policies don't have a destination yet, so they render as
// visibly inert labels instead of dead links.
const NAV_ITEMS: NavItem[] = [
  { label: "Status", href: "#", disabled: true, variant: "link" },
  { label: "Services", href: "/#features", variant: "link" },
  { label: "Policies", href: "#", disabled: true, variant: "link" },
  {
    label: "Discord",
    href: "https://discord.gg/wxAj6WtGQw",
    external: true,
    variant: "solid",
  },
];

const LOGIN_ITEM: NavItem = { label: "Log In", href: "/login", variant: "outline" };

export default function Topbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-6 md:px-16 py-4 bg-black/50 backdrop-blur border-b border-white/10">
      <a href="/" className="flex items-center gap-3 shrink-0">
        <img
          src={LOGO_URL}
          alt="DH Hosting logo"
          className="w-9 h-9 rounded-md object-cover"
        />
        <span className="font-semibold tracking-tight">DH Hosting</span>
      </a>

      <nav className="flex items-center gap-2 md:gap-3 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          if (item.disabled) {
            return (
              <span
                key={item.label}
                title="Coming soon"
                aria-disabled="true"
                className="px-3 py-2 text-sm text-white/30 cursor-not-allowed select-none whitespace-nowrap"
              >
                {item.label}
              </span>
            );
          }

          if (item.variant === "solid") {
            return (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-800 px-4 py-2 text-sm font-semibold text-white whitespace-nowrap shadow-lg shadow-violet-900/40 transition-transform duration-300 ease-out hover:scale-105 hover:bg-violet-700"
              >
                <DiscordIcon className="w-4 h-4" />
                {item.label}
              </a>
            );
          }

          return (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-2 text-sm text-white/70 whitespace-nowrap transition-colors duration-200 hover:text-white"
            >
              {item.label}
            </a>
          );
        })}

        {/* Extra breathing room so Log In doesn't feel bundled with Discord */}
        <a
          href={LOGIN_ITEM.href}
          className="ml-4 md:ml-6 inline-flex items-center rounded-lg border border-violet-700/60 px-4 py-2 text-sm font-medium text-white/80 whitespace-nowrap transition-colors duration-200 hover:border-violet-500 hover:text-white"
        >
          {LOGIN_ITEM.label}
        </a>
      </nav>
    </header>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}