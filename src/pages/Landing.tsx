import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import dashboardImg from "@/assets/landing-dashboard-zoom.png";
import automationsImg from "@/assets/landing-automations-zoom.png";
import eventsImg from "@/assets/landing-events-zoom.png";
import integrationsImg from "@/assets/landing-integrations-zoom.png";

const DotBackground = ({ opacity = 0.1 }: { opacity?: number }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0"
    style={{
      backgroundImage: `radial-gradient(circle, hsl(var(--primary) / ${opacity}) 1.25px, transparent 1.25px)`,
      backgroundSize: "16px 16px",
      maskImage:
        "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
      WebkitMaskImage:
        "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
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
  title,
  text,
  image,
  alt,
  reverse = false,
}: {
  title: string;
  text: string;
  image: string;
  alt: string;
  reverse?: boolean;
}) => {
  const textBlock = (
    <div>
      <h3 className="text-2xl sm:text-[28px] font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md">
        {text}
      </p>
    </div>
  );
  const imageBlock = <ImageFrame src={image} alt={alt} />;

  return (
    <div
      className={`grid grid-cols-1 gap-12 lg:gap-20 items-center ${
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

const Landing = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* TOP NAV */}
      <header className="border-b border-border/80 bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="FlowOps" className="h-[2.1rem]" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Login
            </Link>
            <Button asChild size="sm" className="h-9 px-4">
              <Link to="/signup">Create Workspace</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO - dotted bg */}
      <section className="relative overflow-hidden border-b border-border/80 bg-card">
        <DotBackground opacity={0.1} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            <div>
              <h1 className="text-[44px] sm:text-[56px] font-bold tracking-tight text-foreground leading-[1.05]">
                Automate your workflows without complexity
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground max-w-lg">
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
            <div className="lg:max-w-[624px] lg:ml-auto w-full">
              <ImageFrame src={dashboardImg} alt="FlowOps dashboard" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS - plain bg (#F9FAFB) */}
      <section className="border-b border-border/80 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 text-center sm:text-left">
            {[
              { value: "12K+", label: "Projects managed" },
              { value: "48K+", label: "Automations active" },
              { value: "<200ms", label: "Real-time execution" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SECTIONS - white surface for contrast vs background */}
      <section className="border-b border-border/80 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 space-y-24 sm:space-y-32">
          <ProductSection
            title="Centralized dashboard"
            text="See every project, document, and automation across your workspace in a single, structured overview."
            image={dashboardImg}
            alt="Dashboard overview"
          />
          <ProductSection
            title="Event-driven automations"
            text="Build rules that listen for workspace events and trigger actions across email, Slack, Calendar, or webhooks."
            image={automationsImg}
            alt="Automation builder"
            reverse
          />
          <ProductSection
            title="Full activity visibility"
            text="Every event in your workspace is logged in a clean, filterable timeline - no more guessing what happened."
            image={eventsImg}
            alt="Events timeline"
          />
          <ProductSection
            title="Connect your tools"
            text="Plug FlowOps into the services you already use. One click to connect, manage, or disconnect."
            image={integrationsImg}
            alt="Integrations marketplace"
            reverse
          />
        </div>
      </section>

      {/* HOW IT WORKS - flow strip on contrast surface */}
      <section className="relative overflow-hidden border-b border-border/80 bg-background">
        <DotBackground opacity={0.06} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Four simple steps from setup to automated execution.
            </p>
          </div>

          {/* Flow strip */}
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-0">
            {[
              { n: "01", title: "Create Project", text: "Spin up a workspace project in seconds." },
              { n: "02", title: "Trigger Event", text: "Workspace activity emits structured events.", emphasized: true },
              { n: "03", title: "Automations Run", text: "Matching rules execute the configured actions." },
              { n: "04", title: "Results Delivered", text: "Outcomes are logged and visible in real time." },
            ].map((step, idx, arr) => (
              <div key={step.n} className="flex-1 flex flex-col lg:flex-row items-stretch">
                <div
                  className={`flex-1 rounded-lg bg-card p-6 min-h-[170px] flex flex-col ${
                    step.emphasized
                      ? "border-2 border-primary/30"
                      : "border border-border/80"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-primary tracking-[0.12em]">
                    STEP {step.n}
                  </p>
                  <p className="mt-3 text-[15px] font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {step.text}
                  </p>
                </div>

                {/* Connector */}
                {idx < arr.length - 1 && (
                  <div className="flex items-center justify-center px-2 py-2 lg:py-0 lg:px-3">
                    <ArrowRight className="h-4 w-4 text-border lg:block hidden" strokeWidth={2} />
                    <div className="h-4 w-px bg-border lg:hidden" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA - bordered card on plain bg */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card px-6 py-16 sm:py-20 text-center">
            <DotBackground opacity={0.08} />
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
