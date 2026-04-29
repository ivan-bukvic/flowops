import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import dashboardImg from "@/assets/landing-dashboard.png";
import automationsImg from "@/assets/landing-automations.png";
import eventsImg from "@/assets/landing-events.png";
import integrationsImg from "@/assets/landing-integrations.png";

const DotBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0"
    style={{
      backgroundImage:
        "radial-gradient(circle, hsl(var(--primary) / 0.15) 1.25px, transparent 1.25px)",
      backgroundSize: "16px 16px",
      maskImage:
        "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
      WebkitMaskImage:
        "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
    }}
  />
);

const ImageFrame = ({ src, alt }: { src: string; alt: string }) => (
  <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
    <img src={alt ? src : src} alt={alt} className="w-full h-auto block" loading="lazy" />
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
}) => (
  <div
    className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
      reverse ? "lg:[&>div:first-child]:order-2" : ""
    }`}
  >
    <div>
      <h3 className="text-2xl sm:text-[28px] font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md">
        {text}
      </p>
    </div>
    <ImageFrame src={image} alt={alt} />
  </div>
);

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

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/80">
        <DotBackground />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                Automate your workflows without complexity
              </h1>
              <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground max-w-lg">
                Manage projects, trigger automations, and connect your tools — all in one place.
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
            <ImageFrame src={dashboardImg} alt="FlowOps dashboard" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-border/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
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

      {/* PRODUCT SECTIONS */}
      <section className="border-b border-border/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-20 sm:space-y-28">
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
            text="Every event in your workspace is logged in a clean, filterable timeline — no more guessing what happened."
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

      {/* FLOW */}
      <section className="border-b border-border/80 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Four simple steps from setup to automated execution.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", title: "Create Project", text: "Spin up a workspace project in seconds." },
              { n: "02", title: "Trigger Event", text: "Workspace activity emits structured events." },
              { n: "03", title: "Automations Run", text: "Matching rules execute the configured actions." },
              { n: "04", title: "Results Delivered", text: "Outcomes are logged and visible in real time." },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-lg border border-border/80 bg-card p-5"
              >
                <p className="text-xs font-semibold text-primary tracking-wider">
                  STEP {step.n}
                </p>
                <p className="mt-3 text-[15px] font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <DotBackground />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Start your workspace
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Create an account and have your first automation running in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Button asChild className="h-11 px-6">
              <Link to="/signup">Create Account</Link>
            </Button>
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
