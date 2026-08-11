import { Link } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X, Zap, Plug, Activity, Mail, MessageSquare, Calendar, Webhook } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { styleFor } from "@/lib/integrationColors";
import {
  DashboardPreview,
  BuilderPreview,
  BuilderPreviewFramed,
  EventsPreview,
  IntegrationsPreview,
} from "@/components/landing/AppPreviews";

/**
 * White dot-grid used ONLY inside dark sections (hero, stats, how-it-works,
 * footer CTA). Light sections intentionally have no dot texture.
 */
const DarkDots = ({ fade = "bottom" }: { fade?: "bottom" | "center" }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage: "radial-gradient(hsl(0 0% 100% / 0.2) 1.4px, transparent 1.4px)",
      backgroundSize: "22px 22px",
      maskImage:
        fade === "center"
          ? "radial-gradient(ellipse at center, #000 15%, transparent 74%)"
          : "linear-gradient(to bottom, #000 0%, transparent 80%)",
      WebkitMaskImage:
        fade === "center"
          ? "radial-gradient(ellipse at center, #000 15%, transparent 74%)"
          : "linear-gradient(to bottom, #000 0%, transparent 80%)",
    }}
  />
);

const ProductSection = ({
  id,
  title,
  text,
  preview,
  reverse = false,
  index = 0,
}: {
  id?: string;
  title: string;
  text: string;
  preview: ReactNode;
  reverse?: boolean;
  index?: number;
}) => {
  const fromRight = index % 2 === 0;
  const offset = fromRight ? "100vw" : "-100vw";
  const stagger = index * 100;

  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 20% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const wrapperStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0) scale(1)" : `translateX(${offset}) scale(0.98)`,
    transition: `opacity 1400ms cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms, transform 1400ms cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms`,
    willChange: "opacity, transform",
  };

  const textBlock = (
    <div>
      <h3 className="font-display text-3xl sm:text-[40px] font-bold text-foreground tracking-tight leading-[1.06]">
        {title}
      </h3>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-md">{text}</p>
    </div>
  );
  const previewBlock = <div className="min-w-0">{preview}</div>;

  return (
    <div id={id} ref={ref} className="scroll-mt-24">
      <div
        style={wrapperStyle}
        className={`grid grid-cols-1 gap-12 lg:gap-20 items-center ${
          reverse ? "lg:grid-cols-[7fr_5fr]" : "lg:grid-cols-[5fr_7fr]"
        }`}
      >
        {reverse ? (
          <>
            {previewBlock}
            {textBlock}
          </>
        ) : (
          <>
            {textBlock}
            {previewBlock}
          </>
        )}
      </div>
    </div>
  );
};

const CountUp = ({
  from,
  to,
  prefix = "",
  suffix = "",
  duration = 2800,
}: {
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.round(from + (to - from) * eased));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [from, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "product", label: "Product" },
  { id: "automations", label: "Automations" },
  { id: "activity", label: "Activity" },
  { id: "integrations", label: "Integrations" },
  { id: "how-it-works", label: "How it works" },
];

const WORKFLOW_RESULTS = [
  { icon: Mail, label: "Email", category: "email" as const },
  { icon: MessageSquare, label: "Slack", category: "slack" as const },
  { icon: Calendar, label: "Calendar", category: "calendar" as const },
  { icon: Webhook, label: "Webhook", category: "webhook" as const },
];

/** "Example Workflow" card shown in the Overview section. */
const WorkflowCard = () => (
  <div className="rounded-2xl bg-card p-5 sm:p-6 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Example Workflow</p>
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        Live
      </span>
    </div>

    <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
      <div className="flex-1 rounded-xl bg-muted/50 p-3.5">
        <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Example Trigger</p>
        <p className="mt-1.5 text-sm font-bold text-foreground">Document uploaded</p>
      </div>
      <div className="flex items-center justify-center text-muted-foreground/60">
        <ArrowRight className="hidden h-4 w-4 sm:block" strokeWidth={2.25} />
        <div className="h-3 w-px bg-border sm:hidden" />
      </div>
      <div className="flex-1 rounded-xl bg-muted/50 p-3.5">
        <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Action</p>
        <p className="mt-1.5 text-sm font-bold text-foreground">Run automation</p>
      </div>
      <div className="flex items-center justify-center text-muted-foreground/60">
        <ArrowRight className="hidden h-4 w-4 sm:block" strokeWidth={2.25} />
        <div className="h-3 w-px bg-border sm:hidden" />
      </div>
      <div className="flex-[1.1] rounded-xl bg-muted/50 p-3.5">
        <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Result</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WORKFLOW_RESULTS.map(({ icon: Icon, label, category }) => {
            const style = styleFor(category);
            return (
              <span
                key={label}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const HOW_STEPS = [
  { n: "01", title: "Create Project", text: "Spin up a workspace project in seconds." },
  { n: "02", title: "Trigger Event", text: "Workspace activity emits structured events." },
  { n: "03", title: "Automations Run", text: "Matching rules execute the configured actions." },
  { n: "04", title: "Results Delivered", text: "Outcomes are logged and visible in real time." },
];

const FAQS = [
  {
    q: "What is FlowOps?",
    a: "FlowOps is a workspace platform that combines projects, documents, and event-driven automations in one place - so your team can ship work without juggling tools.",
  },
  {
    q: "How do automations work?",
    a: "Every action in your workspace emits a structured event. You build rules that listen for those events and trigger actions like sending an email, posting to Slack, or calling a webhook.",
  },
  {
    q: "Do I need technical knowledge?",
    a: "No. Automations are configured visually with a trigger → action flow. If you can describe a workflow, you can build it in FlowOps.",
  },
  {
    q: "Which tools can I integrate?",
    a: "FlowOps connects to common tools like Email, Slack, Google Calendar, and generic webhooks - so you can plug it into the stack you already use.",
  },
  {
    q: "Can I track activity and logs?",
    a: "Yes. Every event and automation run is logged in a clean, filterable timeline, so you always know what happened and when.",
  },
  {
    q: "Is there a free plan?",
    a: "You can create a workspace and run your first automations for free. Paid plans unlock higher limits and advanced integrations.",
  },
];

const Landing = () => {
  const [activeId, setActiveId] = useState<string>("product");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
          scrolled
            ? "bg-white/80 backdrop-blur-md border-b border-border/70 shadow-sm"
            : "bg-white/70 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto flex items-center gap-3 px-4 transition-all duration-300 ease-in-out ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="FlowOps" className="h-[1.9rem]" />
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`text-[13.5px] font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeId === item.id
                    ? "text-foreground bg-secondary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 ml-auto md:ml-0 shrink-0">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-[9px] text-[13.5px] font-semibold bg-white text-foreground border border-border shadow-sm hover:bg-secondary transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-[9px] text-[13.5px] font-semibold text-white bg-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)] hover:bg-primary/90 transition-colors"
            >
              Create Workspace
            </Link>
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
          <div className="md:hidden border-t border-border/70 bg-card">
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
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
              <div className="mt-2 pt-2 border-t border-border/70 flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/signup">Create Workspace</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* HERO — dark section with dot-grid */}
      <section className="relative overflow-hidden bg-sidebar">
        <DarkDots fade="bottom" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-14 lg:gap-16 items-center">
            <div>
              <h1 className="font-display text-[42px] sm:text-[56px] lg:text-[64px] font-bold tracking-tight text-white leading-[1.0]">
                <span className="text-[hsl(226_72%_74%)]">Automate</span> everything that matters.
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed max-w-lg text-white/75">
                Manage projects, trigger automations, and connect your tools - all in one unified workspace.
              </p>
              <div className="mt-8 flex items-center gap-5">
                <Button
                  asChild
                  className="h-12 px-6 text-[15px] shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.8)]"
                >
                  <Link to="/signup">Create Workspace</Link>
                </Button>
                <Link to="/login" className="text-[15px] font-semibold text-white hover:text-white/80 transition-colors">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="w-full">
              <BuilderPreview />
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW — light, no dots */}
      <section id="overview" className="scroll-mt-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[11.5px] font-bold text-primary tracking-[0.14em] uppercase">Overview</p>
              <h2 className="mt-3.5 font-display text-3xl sm:text-[44px] font-bold text-foreground tracking-tight leading-[1.05]">
                What is FlowOps?
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-foreground/90 max-w-md">
                FlowOps is a unified workspace where you can manage projects, automate workflows, and connect your tools - all in one place.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-md">
                Instead of juggling multiple tools and manual processes, FlowOps lets you define events, trigger actions, and keep everything organized and visible in real time.
              </p>

              <ul className="mt-7 space-y-3 max-w-md">
                {[
                  { icon: Zap, label: "Automate repetitive workflows", bg: "bg-automation/10", text: "text-automation" },
                  { icon: Plug, label: "Keep all your tools connected", bg: "bg-primary/10", text: "text-primary" },
                  { icon: Activity, label: "Track everything in real time", bg: "bg-success/10", text: "text-success" },
                ].map(({ icon: Icon, label, bg, text }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${text}`}>
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <span className="text-[14.5px] font-semibold text-foreground">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <WorkflowCard />
              <p className="mt-4 text-center text-[13.5px] text-muted-foreground">
                Create workflows for any event - this is just one example.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS — dark card with dots */}
      <section className="bg-background">
        <div className="max-w-7xl mx-auto px-4 pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 sm:px-10 py-14 sm:py-16">
            <DarkDots fade="center" />
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 text-center">
              {[
                { from: 0, to: 4, suffix: "K+", label: "Projects managed" },
                { from: 0, to: 16, suffix: "K+", label: "Automations active" },
                { from: 800, to: 200, prefix: "<", suffix: "ms", label: "Real-time execution" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-4xl sm:text-[46px] font-bold text-white tracking-tight tabular-nums">
                    <CountUp from={s.from} to={s.to} prefix={s.prefix} suffix={s.suffix} />
                  </p>
                  <p className="mt-3 text-sm text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SECTIONS — light, live previews */}
      <section className="bg-background overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-24 sm:space-y-28">
          <ProductSection
            id="product"
            index={0}
            title="Centralized dashboard"
            text="See every project, document, and automation across your workspace in a single, structured overview."
            preview={<DashboardPreview />}
          />
          <ProductSection
            id="automations"
            index={1}
            title="Event-driven automations"
            text="Build rules that listen for workspace events and trigger actions across email, Slack, Calendar, or webhooks."
            preview={<BuilderPreviewFramed />}
            reverse
          />
          <ProductSection
            id="activity"
            index={2}
            title="Full activity visibility"
            text="Every event in your workspace is logged in a clean, filterable timeline - no more guessing what happened."
            preview={<EventsPreview />}
          />
          <ProductSection
            id="integrations"
            index={3}
            title="Connect your tools"
            text="Plug FlowOps into the services you already use. One click to connect, manage, or disconnect."
            preview={<IntegrationsPreview />}
            reverse
          />
        </div>
      </section>

      {/* HOW IT WORKS — dark card with dots */}
      <section id="how-it-works" className="scroll-mt-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 sm:px-10 py-16 sm:py-20">
            <DarkDots fade="center" />
            <div className="relative">
              <div className="text-center mb-12">
                <p className="text-[11.5px] font-bold tracking-[0.16em] uppercase text-[hsl(226_72%_74%)]">
                  How it works
                </p>
                <h2 className="mt-3 font-display text-3xl sm:text-[44px] font-bold tracking-tight text-white">
                  From setup to automated execution
                </h2>
                <p className="mt-3 text-white/70 text-base">
                  Four simple steps from setup to automated execution.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {HOW_STEPS.map((step) => (
                  <div key={step.n} className="rounded-2xl bg-card p-5 shadow-[0_18px_40px_-22px_hsl(0_0%_0%/0.6)]">
                    <p className="text-[10.5px] font-bold tracking-[0.1em] text-primary">STEP {step.n}</p>
                    <p className="mt-2 font-display text-[17px] font-bold text-foreground">{step.title}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — functional accordion */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-[40px] font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-base text-muted-foreground">Everything you need to know about FlowOps.</p>
          </div>

          <Accordion type="single" collapsible className="space-y-2.5">
            {FAQS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-0 rounded-xl bg-card shadow-card px-5"
              >
                <AccordionTrigger className="text-left font-display text-[15.5px] font-semibold text-foreground hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA — dark card with dots */}
      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 py-16 sm:py-20 text-center">
            <DarkDots fade="center" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-[44px] font-bold tracking-tight text-white">
                Start your workspace
              </h2>
              <p className="mt-3 text-base text-white/75 max-w-md mx-auto leading-relaxed">
                Create an account and have your first automation running in minutes.
              </p>
              <div className="mt-8 flex items-center justify-center">
                <Button
                  asChild
                  className="h-12 px-7 text-[15px] shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.8)]"
                >
                  <Link to="/signup">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/70 bg-background">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">© FlowOps AI</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Link to="/signup" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
