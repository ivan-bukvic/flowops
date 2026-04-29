import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import dashboardImg from "@/assets/landing-dashboard-zoom.png";
import heroAutomationImg from "@/assets/landing-hero-automation.png";
import automationsImg from "@/assets/landing-automations-zoom.png";
import eventsImg from "@/assets/landing-events-zoom.png";
import integrationsImg from "@/assets/landing-integrations-zoom.png";

/**
 * Dotted background with a left -> right horizontal fade.
 * Dots use the primary color; opacity is strongest on the left and
 * fades to zero on the right via a mask gradient.
 * Same system used in HERO and CTA card for consistency.
 */
const DotBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0"
    style={{
      backgroundImage: `radial-gradient(circle, hsl(var(--primary) / 0.55) 1px, transparent 1px)`,
      backgroundSize: "16px 16px",
      maskImage:
        "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 100%)",
      WebkitMaskImage:
        "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 100%)",
    }}
  />
);

/**
 * Framed screenshot:
 * - outer wrapper sits on the section bg and creates a subtle "lifted object" feel
 * - inner card is white with a thin border + padding so the image reads as an object
 */
const ImageFrame = ({ src, alt }: { src: string; alt: string }) => (
  <div className="rounded-xl border border-border/80 bg-secondary/60 p-2 sm:p-3 w-full">
    <div className="rounded-lg border border-border/80 bg-card p-2 sm:p-3">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover block"
          loading="lazy"
        />
      </div>
    </div>
  </div>
);

const ProductSection = ({
  id,
  title,
  text,
  image,
  alt,
  reverse = false,
}: {
  id?: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  reverse?: boolean;
}) => {
  const textBlock = (
    <div className="relative -mx-6 sm:-mx-8 -my-8 sm:-my-10 px-6 sm:px-8 py-8 sm:py-10">
      <DotBackground />
      <div className="relative z-10">
        <h3 className="text-2xl sm:text-[28px] font-semibold text-foreground tracking-tight">
          {title}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md">
          {text}
        </p>
      </div>
    </div>
  );
  const imageBlock = <ImageFrame src={image} alt={alt} />;

  return (
    <div
      id={id}
      className={`scroll-mt-24 grid grid-cols-1 gap-12 lg:gap-20 items-center ${
        reverse ? "lg:grid-cols-[8fr_4fr]" : "lg:grid-cols-[4fr_8fr]"
      }`}
    >
      {reverse ? (
        <>
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
        </>
      )}
    </div>
  );
};

const NAV_ITEMS = [
  { id: "product", label: "Product" },
  { id: "automations", label: "Automations" },
  { id: "activity", label: "Activity" },
  { id: "integrations", label: "Integrations" },
  { id: "how-it-works", label: "How it works" },
];

const Landing = () => {
  const [activeId, setActiveId] = useState<string>("product");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      const offset = 120;
      const scrollY = window.scrollY + offset;
      let current = NAV_ITEMS[0].id;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollY) current = item.id;
      }
      setActiveId(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* TOP NAV */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="FlowOps" className="h-[2.1rem]" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                  activeId === item.id
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Login
            </Link>
            <Button asChild size="sm" className="h-9 px-4 hidden sm:inline-flex">
              <Link to="/signup">Create Workspace</Link>
            </Button>
            <button
              type="button"
              aria-label="Toggle menu"
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-secondary"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/80 bg-card">
            <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`text-sm font-medium px-3 py-2.5 rounded-md transition-colors ${
                    activeId === item.id
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 pt-2 border-t border-border/80 flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="flex-1">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/signup">Create Workspace</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* HERO - dotted bg */}
      <section className="relative overflow-hidden border-b border-border/80 bg-card">
        <DotBackground />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-14 lg:gap-16 items-center">
            <div>
              <h1 className="text-[44px] sm:text-[56px] font-bold tracking-tight text-foreground leading-[1.05]">
                Automate your workflows without complexity
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed max-w-lg text-secondary-foreground">
                Manage projects, trigger automations, and connect your tools - all in one place.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Button asChild className="h-11 px-6">
                  <Link to="/signup">Create Workspace</Link>
                </Button>
                <Button asChild variant="ghost" className="h-11 px-4">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </div>
            <div className="w-full lg:-mr-8 xl:-mr-16">
              <div className="rounded-xl border border-border/80 bg-card p-1.5 sm:p-2 w-full overflow-hidden">
                <img
                  src={heroAutomationImg}
                  alt="FlowOps automation builder - configure triggers and actions"
                  className="w-full h-auto block rounded-lg"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS - contained dark card */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-16 sm:my-20">
          <div className="rounded-2xl border border-white/5 bg-[#0F172A] px-6 sm:px-10 py-12 sm:py-14">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center">
              {[
                { value: "12K+", label: "Projects managed" },
                { value: "48K+", label: "Automations active" },
                { value: "<200ms", label: "Real-time execution" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
                    {s.value}
                  </p>
                  <p className="mt-2 text-sm text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SECTIONS - white surface for contrast vs background */}
      <section className="border-b border-border/80 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 space-y-24 sm:space-y-32">
          <ProductSection
            id="product"
            title="Centralized dashboard"
            text="See every project, document, and automation across your workspace in a single, structured overview."
            image={dashboardImg}
            alt="Dashboard overview"
          />
          <ProductSection
            id="automations"
            title="Event-driven automations"
            text="Build rules that listen for workspace events and trigger actions across email, Slack, Calendar, or webhooks."
            image={automationsImg}
            alt="Automation builder"
            reverse
          />
          <ProductSection
            id="activity"
            title="Full activity visibility"
            text="Every event in your workspace is logged in a clean, filterable timeline - no more guessing what happened."
            image={eventsImg}
            alt="Events timeline"
          />
          <ProductSection
            id="integrations"
            title="Connect your tools"
            text="Plug FlowOps into the services you already use. One click to connect, manage, or disconnect."
            image={integrationsImg}
            alt="Integrations marketplace"
            reverse
          />
        </div>
      </section>

      {/* HOW IT WORKS - contained dark card */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-16 sm:my-20">
          <div className="rounded-2xl border border-white/5 bg-[#0F172A] px-6 sm:px-10 py-20 sm:py-24">
            <div className="text-center mb-14">
              <p className="text-[11px] font-semibold text-white/60 tracking-[0.18em] uppercase">
                How it works
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                From setup to automated execution
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Four simple steps from setup to automated execution.
              </p>
            </div>

            {/* Flow strip */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-5 lg:gap-0">
              {[
                { n: "01", title: "Create Project", text: "Spin up a workspace project in seconds." },
                { n: "02", title: "Trigger Event", text: "Workspace activity emits structured events." },
                { n: "03", title: "Automations Run", text: "Matching rules execute the configured actions.", emphasized: true },
                { n: "04", title: "Results Delivered", text: "Outcomes are logged and visible in real time." },
              ].map((step, idx, arr) => (
                <div key={step.n} className="flex-1 flex flex-col lg:flex-row items-stretch">
                  <div
                    className={`flex-1 rounded-lg bg-white p-6 min-h-[190px] flex flex-col ${
                      step.emphasized
                        ? "border-2 border-primary/50"
                        : "border border-[#E5E7EB]"
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-primary tracking-[0.12em]">
                      STEP {step.n}
                    </p>
                    <p className="mt-3 text-[15px] font-semibold text-[#111827]">
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {step.text}
                    </p>
                  </div>

                  {/* Connector */}
                  {idx < arr.length - 1 && (
                    <div className="flex items-center justify-center px-2 py-2 lg:py-0 lg:px-3">
                      <ArrowRight className="h-4 w-4 text-white/30 lg:block hidden" strokeWidth={2} />
                      <div className="h-4 w-px bg-white/20 lg:hidden" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - bordered card on plain bg */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card px-6 py-16 sm:py-20 text-center">
            <DotBackground />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Start your workspace
              </h2>
              <p className="mt-3 text-[15px] text-muted-foreground max-w-md mx-auto">
                Create an account and have your first automation running in minutes.
              </p>
              <div className="mt-8 flex items-center justify-center">
                <Button asChild className="h-12 px-7 text-[15px]">
                  <Link to="/signup">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© FlowOps AI</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Link to="/signup" className="text-xs text-muted-foreground hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
