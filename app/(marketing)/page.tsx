import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  Check,
  Factory,
  Handshake,
  MapPinned,
  Menu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kincaid Building Group | Development & Construction",
  description:
    "Real estate development and construction services for owners, investors, and developers across Michigan.",
};

const navItems = [
  ["Services", "#services"],
  ["Process", "#process"],
  ["Projects", "#projects"],
  ["Contact", "#contact"],
];

const proof = [
  ["Since 2005", "Commercial development and construction across Michigan"],
  ["One process", "Collaborate, Create, Succeed from first idea to delivery"],
  ["Complex work", "Urban infill, Brownfield, mixed-use, historic, and adaptive re-use"],
];

const services = [
  {
    icon: Building2,
    title: "Real estate development",
    copy: "Practical guidance for business owners, investors, and developers evaluating sites, opportunities, and project direction.",
  },
  {
    icon: Factory,
    title: "Construction management",
    copy: "Full-scale leadership for commercial construction, mixed-use work, adaptive re-use, hospitality, and neighborhood revitalization.",
  },
  {
    icon: Handshake,
    title: "Client-first partnership",
    copy: "A collaborative, trust-based model designed to keep teams aligned, decisions visible, and outcomes protected.",
  },
];

const process = [
  ["01", "Collaborate", "Align the client, site, capital plan, design team, schedule, and project constraints before momentum is expensive."],
  ["02", "Create", "Turn the opportunity into a workable path with development insight, construction discipline, and coordinated execution."],
  ["03", "Succeed", "Deliver a project built around the business case, the community context, and the client’s long-term goals."],
];

const projects = [
  {
    title: "Marshall Street Armory",
    type: "Historic adaptive re-use",
    src: "/kincaid/original-armory.jpg",
    alt: "Restored brick Armory building project by Kincaid Building Group.",
  },
  {
    title: "MSU Technologies",
    type: "Commercial office",
    src: "/kincaid/original-msu-tech.jpg",
    alt: "MSU Technologies commercial construction project.",
  },
  {
    title: "Option 1 Credit Union",
    type: "Commercial construction",
    src: "/kincaid/original-option1.jpg",
    alt: "Option 1 Credit Union project by Kincaid Building Group.",
  },
  {
    title: "CoSpace",
    type: "Urban infill",
    src: "/kincaid/original-cospace.jpg",
    alt: "CoSpace commercial project by Kincaid Building Group.",
  },
];

const experience = [
  "Urban infill",
  "Commercial office",
  "Multi-family",
  "Mixed use",
  "Adaptive re-use",
  "Historic",
  "Brownfield",
  "Restaurants",
  "Neighborhood revitalization",
];

export default function MarketingPage() {
  return (
    <main className="min-h-dvh bg-[#f5f3ef] text-[#171717]">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-10">
        <div className="mx-auto flex w-fit max-w-[calc(100vw-1rem)] items-center gap-2 rounded-lg border border-white/65 bg-white/92 px-3 py-3 shadow-xl shadow-black/10 sm:max-w-[calc(100vw-3rem)] sm:gap-4 sm:px-4">
          <a
            href="#top"
            aria-label="Kincaid Building Group home"
            className="flex min-h-14 shrink-0 items-center px-2"
          >
            <Image
              src="/kincaid/kincaid-full-logo-2019-transparent-clean.png"
              alt="Kincaid Building Group"
              width={280}
              height={94}
              priority
              className="h-auto w-[132px] sm:w-[205px]"
            />
          </a>
          <nav className="hidden items-center border-l border-black/10 pl-4 lg:flex" aria-label="Primary">
            {navItems.map(([label, href]) => (
              <a
                className="rounded-md px-3 py-2 text-xs font-bold uppercase text-zinc-700 hover:bg-black/5 hover:text-[#b4111a]"
                href={href}
                key={label}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 border-l border-black/10 pl-3 sm:gap-3 sm:pl-4">
            <a
              href="tel:15173328210"
              className="hidden whitespace-nowrap text-sm font-bold uppercase text-zinc-700 hover:text-[#b4111a] xl:inline-flex"
            >
              (517) 332-8210
            </a>
            <a
              href="#contact"
              className="inline-flex min-h-10 whitespace-nowrap items-center justify-center rounded-md bg-[#b4111a] px-4 text-sm font-bold uppercase text-white hover:bg-black sm:px-5"
            >
              Start a project
            </a>
            <details className="relative lg:hidden">
              <summary
                aria-label="Open navigation menu"
                className="flex min-h-10 list-none items-center justify-center rounded-md border border-black/10 bg-white/60 px-3 text-zinc-800 hover:bg-black/5 [&::-webkit-details-marker]:hidden"
              >
                <Menu aria-hidden="true" size={20} />
              </summary>
              <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl shadow-black/15">
                <nav className="grid p-2" aria-label="Mobile primary">
                  {navItems.map(([label, href]) => (
                    <a
                      className="rounded-md px-4 py-3 text-sm font-bold uppercase text-zinc-800 hover:bg-[#f5f3ef] hover:text-[#b4111a]"
                      href={href}
                      key={label}
                    >
                      {label}
                    </a>
                  ))}
                </nav>
                <div className="border-t border-black/10 p-3">
                  <a
                    href="tel:15173328210"
                    className="flex min-h-11 items-center justify-center rounded-md bg-[#f5f3ef] px-4 text-sm font-bold uppercase text-zinc-800 hover:text-[#b4111a]"
                  >
                    (517) 332-8210
                  </a>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section id="top" className="relative min-h-dvh overflow-hidden bg-black">
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 size-full object-cover"
          loop
          muted
          playsInline
          poster="/kincaid/original-armory.jpg"
          preload="metadata"
        >
          <source src="/kincaid/homepage-slider-video-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_75%,rgba(180,17,26,0.34),transparent_34%)]" />

        <div className="relative mx-auto grid min-h-dvh max-w-7xl gap-8 px-5 pb-10 pt-32 sm:px-8 lg:grid-cols-[1fr_380px] lg:items-end lg:px-10 lg:pb-16">
          <div className="max-w-4xl text-white">
            <p className="text-sm font-bold uppercase text-[#ff5a63]">Kincaid Building Group</p>
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold uppercase leading-tight sm:text-5xl lg:text-6xl">
              Build the project before the project builds risk.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-100">
              Real estate development and construction services for owners, investors, and
              developers who need a clear path from opportunity to successful delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#b4111a] px-5 text-sm font-bold uppercase text-white hover:bg-white hover:text-black"
              >
                Discuss a project
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a
                href="#process"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/35 px-5 text-sm font-bold uppercase text-white hover:bg-white/10"
              >
                See the process
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-white/20 bg-white/92 p-5 shadow-2xl shadow-black/25">
            <p className="text-sm font-bold uppercase text-[#b4111a]">Start here</p>
            <h2 className="mt-3 text-balance text-2xl font-semibold uppercase leading-tight">
              Get clarity on scope, site, budget, and next steps.
            </h2>
            <div className="mt-5 grid gap-3">
              {["Site and feasibility", "Development strategy", "Construction path"].map((item) => (
                <div className="flex items-center gap-3" key={item}>
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#b4111a] text-white">
                    <Check aria-hidden="true" size={14} />
                  </span>
                  <span className="font-semibold text-zinc-800">{item}</span>
                </div>
              ))}
            </div>
            <a
              href="https://www.kincaidbuild.com/contact/"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-black px-5 text-sm font-bold uppercase text-white hover:bg-[#b4111a]"
            >
              Contact Kincaid
            </a>
          </aside>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {proof.map(([value, label]) => (
            <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm" key={value}>
              <strong className="block text-3xl font-semibold uppercase text-[#b4111a]">{value}</strong>
              <p className="mt-3 text-pretty leading-7 text-zinc-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#b4111a]">What we do</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold uppercase leading-tight md:text-5xl">
                One partner for development and construction.
              </h2>
            </div>
            <p className="text-pretty text-lg leading-8 text-zinc-600">
              Kincaid combines development insight with field-tested construction management so
              decisions stay connected to real project outcomes.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map(({ icon: Icon, title, copy }) => (
              <article className="rounded-lg border border-black/10 bg-white p-6 shadow-sm" key={title}>
                <Icon aria-hidden="true" className="text-[#b4111a]" size={30} />
                <h3 className="mt-12 text-2xl font-semibold uppercase">{title}</h3>
                <p className="mt-4 text-pretty leading-7 text-zinc-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="bg-[#171717] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#ff5a63]">Collaborate, Create, Succeed</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold uppercase leading-tight md:text-5xl">
              A proven process made practical.
            </h2>
            <p className="mt-6 text-pretty text-lg leading-8 text-zinc-300">
              Kincaid reimagined the development and construction experience around clarity,
              collaboration, and the client’s most important outcomes.
            </p>
            <div className="mt-8 rounded-lg bg-[#3f5d63] p-3">
              <Image
                src="/kincaid/kincaid-process-graphic.png"
                alt="Kincaid process graphic showing Collaborate, Create, Succeed."
                width={2048}
                height={680}
                className="h-auto w-full rounded-md"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {process.map(([number, title, copy]) => (
              <article className="rounded-lg border border-white/10 bg-white/5 p-6" key={title}>
                <span className="font-mono text-sm font-bold text-[#ff5a63]">{number}</span>
                <h3 className="mt-5 text-2xl font-semibold uppercase">{title}</h3>
                <p className="mt-3 text-pretty leading-7 text-zinc-300">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-200">
            <Image
              src="/kincaid/original-msu-tech.jpg"
              alt="MSU Technologies commercial project exterior."
              fill
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase text-[#b4111a]">Experience</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold uppercase leading-tight md:text-5xl">
              Built for the messy middle of real projects.
            </h2>
            <p className="mt-6 text-pretty text-lg leading-8 text-zinc-600">
              Kincaid is positioned for project types where coordination, constraints, capital, and
              community context all matter.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {experience.map((item) => (
                <div className="flex items-center gap-3" key={item}>
                  <Check aria-hidden="true" className="text-[#b4111a]" size={18} />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#b4111a]">Selected projects</p>
              <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold uppercase leading-tight md:text-5xl">
                Proof you can see from the street.
              </h2>
            </div>
            <a
              href="https://www.kincaidbuild.com/commercial-construction-projects/"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-black px-5 text-sm font-bold uppercase text-white hover:bg-[#b4111a]"
            >
              View all projects
            </a>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {projects.map((project, index) => (
              <article className={index === 0 ? "group md:col-span-2" : "group"} key={project.title}>
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-zinc-200">
                  <Image
                    src={project.src}
                    alt={project.alt}
                    fill
                    sizes={index === 0 ? "(max-width: 768px) 100vw, 80vw" : "(max-width: 768px) 100vw, 50vw"}
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold uppercase">{project.title}</h3>
                    <p className="mt-1 text-sm font-bold uppercase text-[#b4111a]">{project.type}</p>
                  </div>
                  <ArrowRight aria-hidden="true" className="mt-1 text-zinc-500 group-hover:text-[#b4111a]" size={22} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-black px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_390px] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#ff5a63]">Start the conversation</p>
            <h2 className="mt-3 max-w-4xl text-balance text-3xl font-semibold uppercase leading-tight md:text-5xl">
              Bring the site, the idea, or the business case.
            </h2>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-300">
              Kincaid will help you understand what comes next and what needs to be true for the
              project to succeed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://www.kincaidbuild.com/contact/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#b4111a] px-5 text-sm font-bold uppercase text-white hover:bg-white hover:text-black"
              >
                Contact Kincaid
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a
                href="tel:15173328210"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 px-5 text-sm font-bold uppercase text-white hover:bg-white/10"
              >
                (517) 332-8210
              </a>
            </div>
          </div>
          <aside className="rounded-lg border border-white/10 bg-white/5 p-6">
            <MapPinned aria-hidden="true" className="text-[#ff5a63]" size={32} />
            <h3 className="mt-8 text-2xl font-semibold uppercase">East Lansing, Michigan</h3>
            <p className="mt-4 text-pretty leading-7 text-zinc-300">
              1515 Turf Lane #200
              <br />
              East Lansing, MI 48823
            </p>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-pretty leading-7 text-zinc-300">
                Development and construction services for business owners, investors, and
                developers across Michigan.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
