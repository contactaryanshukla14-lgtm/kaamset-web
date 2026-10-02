import { Fragment, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api, type PublicSite } from "./api";
export default function BusinessWebsite({ slug }: { slug: string }) {
  const [site, setSite] = useState<PublicSite | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .publicSite(slug)
      .then((s) => {
        setSite(s);
        document.title = `${s.content.name} · KaamSet`;
      })
      .catch((e) => setError(e.message));
  }, [slug]);
  if (!site)
    return (
      <main className="customer-quote-page">
        <h1>
          {error ? "Website unavailable" : "Opening the business website…"}
        </h1>
        <p>{error || "Vijay is getting the published page."}</p>
        <a href="/">Visit KaamSet</a>
      </main>
    );
  const c = site.content,
    contact = site.phone ? `https://wa.me/${site.phone}` : null,
    plan = site.studio;
  const safeHex = (s: string | undefined, fallback: string) =>
    s && /^#[a-f0-9]{6}$/i.test(s) ? s : fallback;
  const style = plan
    ? ({
        "--web-accent": safeHex(plan.accent, "#00b9f1"),
        "--web-ink": safeHex(plan.ink, "#002b59"),
        "--web-bg": safeHex(plan.background, "#ffffff"),
      } as CSSProperties)
    : undefined;
  const photo = site.assets?.find((a) =>
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(a.src),
  );
  const about = (
    <section id="about" className="business-about">
      {c.sections.map((s, i) => (
        <article key={i}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </div>
        </article>
      ))}
    </section>
  );
  const hero = (
    <section id="home" className="business-hero">
      <div>
        <span className="business-tag">{c.design.tag}</span>
        <h1>{c.headline}</h1>
        <p>{c.description}</p>
        <div className="business-hero-actions">
          {contact && (
            <a
              href={contact}
              className="business-cta"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} /> Enquire on WhatsApp
            </a>
          )}
          <a
            className="business-secondary"
            href={site.offers?.length ? "#offer" : "#about"}
          >
            Explore our business <ArrowRight size={16} />
          </a>
        </div>
      </div>
      {photo && plan?.heroStyle !== "type-led" ? (
        <div className="business-photo">
          <img src={photo.src} alt={photo.alt} />
          <span>{c.name}</span>
        </div>
      ) : (
        <div className="business-art" aria-hidden="true">
          <div className="business-art-grid" />
          <span className="art-label">{c.name}</span>
          <Package size={75} />
          <span className="art-corner">LET’S TALK BUSINESS</span>
        </div>
      )}
    </section>
  );
  const offerings = site.offers?.length ? (
    <section id="offer" className="business-offers">
      <div className="business-section-title">
        <span>MADE FOR YOUR NEEDS</span>
        <h2>
          {site.offers?.length
            ? "A clear offer. A simple next step."
            : "Let’s find the right fit for you."}
        </h2>
      </div>
      <div className="business-product-grid">
        {site.offers?.map((o, i) => (
          <article key={i}>
            <span className="product-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{o.name}</h3>
            <strong>
              ₹
              {(o.pricePaise / 100).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
              <small>
                {" "}
                / {o.kind === "appointment" ? "appointment" : "unit"}
              </small>
            </strong>
            <p>Minimum quantity: {o.minimumQuantity}</p>
            <p>{o.terms}</p>
            {contact && (
              <a href={contact} target="_blank" rel="noreferrer">
                Ask about this <ArrowRight size={16} />
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  ) : null;
  const faq = c.faqs.length ? (
    <section className="business-faq">
      <div>
        <span>GOOD TO KNOW</span>
        <h2>A few useful answers.</h2>
      </div>
      <div>
        {c.faqs.map((f, i) => (
          <details key={i}>
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  ) : null;
  const contactSection = contact ? (
    <section className="business-contact">
      <MessageCircle size={28} />
      <h2>Let’s talk about what you need.</h2>
      <a
        href={contact}
        className="business-cta"
        target="_blank"
        rel="noreferrer"
      >
        Start a conversation <ArrowRight size={17} />
      </a>
    </section>
  ) : null;
  const gallery =
    (site.assets?.length || 0) > 1 ? (
      <section className="business-gallery">
        {site.assets
          ?.slice(1)
          .filter((a) =>
            /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(a.src),
          )
          .map((a) => (
            <figure key={a.id}>
              <img loading="lazy" src={a.src} alt={a.alt} />
              <figcaption>{a.alt}</figcaption>
            </figure>
          ))}
      </section>
    ) : null;
  const order = plan?.sectionOrder || [
    "hero",
    "offerings",
    "about",
    "faq",
    "contact",
  ];
  const blocks = {
    hero,
    offerings,
    about,
    process: about,
    faq,
    contact: contactSection,
  };
  const rendered = new Set<string>();
  return (
    <div
      style={style}
      className={`business-website web-${c.design.palette} layout-${c.design.layout} ${plan ? `studio-${plan.layout} hero-${plan.heroStyle}` : ""}`}
    >
      <header className="business-nav">
        <a href="#home" className="business-name">
          <span className="business-symbol">
            <Sparkles size={20} />
          </span>
          {c.name}
        </a>
        <nav>
          <a href={site.offers?.length ? "#offer" : "#about"}>
            {site.offers?.some((o) => o.kind === "product")
              ? "Our products"
              : "What we offer"}
          </a>
          {order.some((k) => k === "about" || k === "process") && (
            <a href="#about">Our business</a>
          )}
          {contact && (
            <a
              href={contact}
              className="business-cta"
              target="_blank"
              rel="noreferrer"
            >
              Talk to us <ArrowRight size={15} />
            </a>
          )}
        </nav>
      </header>
      <main>
        {order.map((kind) => {
          const key = kind === "process" ? "about" : kind;
          if (rendered.has(key)) return null;
          rendered.add(key);
          return (
            <Fragment key={kind}>
              {blocks[kind as keyof typeof blocks]}
              {kind === "offerings" && gallery}
            </Fragment>
          );
        })}
      </main>
      <footer className="business-footer">
        <strong>{c.name}</strong>
        <span>
          <ShieldCheck size={14} /> Published with KaamSet
          {site.trial ? " · Guest trial" : ""}
        </span>
        <small>
          {site.trial
            ? `Available until ${new Date(site.expiresAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}. `
            : ""}
          Enquiries do not confirm stock, payment or delivery.
        </small>
        <a href="/">Build your own AI team ↗</a>
      </footer>
    </div>
  );
}
