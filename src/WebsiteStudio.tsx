import { useState } from "react";
import {
  ArrowRight,
  Copy,
  ExternalLink,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { api, type WorkspaceState } from "./api";
import PixelTeammate from "./PixelTeammate";
import { memberCharacter, websiteStageName } from "./team-identity";
export default function WebsiteStudio({
  token,
  workspace,
  onChange,
  onBuild,
}: {
  token: string | null;
  workspace: WorkspaceState | null;
  onChange: () => Promise<unknown>;
  onBuild: () => void;
}) {
  const [name, setName] = useState(workspace?.business?.name || ""),
    [instructions, setInstructions] = useState(
      "Create a polished, mobile-friendly business website in Hinglish. Explain our offer clearly and make it easy to enquire. Keep every business claim grounded.",
    ),
    [phone, setPhone] = useState(""),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState("");
  const vijay = workspace?.blueprints.find(
    (b) => b.state === "active" && b.plan.skills.includes("website_publish"),
  );
  const [photos, setPhotos] = useState<
    { alt: string; photo: string; rightsConfirmed: true }[]
  >([]);
  const cloudWorking = workspace?.sites?.some((site) =>
    ["queued", "working"].includes(site.state),
  );
  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="merchant-tool website-studio">
      <div className="milan-heading">
        <PixelTeammate
          id="vijay"
          state={busy || cloudWorking ? "working" : "idle"}
        />
        <div>
          <span className="card-kicker">VIJAY · YOUR WEBSITE TEAM</span>
          <h2>Your business deserves a home online.</h2>
          <p>
            Describe your style. Vijay builds a responsive site from approved
            facts and publishes it with a usable KaamSet link.
          </p>
        </div>
      </div>
      {error && (
        <p className="workspace-error" role="alert">
          {error}
        </p>
      )}
      {!vijay && (
        <div className="setup-box">
          <strong>Build and activate Vijay first.</strong>
          <p>
            Your approved playbook becomes his source. He checks the job before
            building.
          </p>
          <button className="button button-dark" onClick={onBuild}>
            Give Vijay a website job <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="merchant-form-grid">
        <label>
          Public business name
          <input
            maxLength={80}
            value={name}
            placeholder="Your business name"
            onChange={(e) => {
              setName(e.target.value);
              setApproved(false);
            }}
          />
        </label>
        <label>
          Public WhatsApp number (optional)
          <input
            value={phone}
            inputMode="tel"
            placeholder="91 followed by your 10-digit number"
            maxLength={12}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setApproved(false);
            }}
          />
        </label>
      </div>
      <label>
        What should the website feel like?
        <textarea
          rows={4}
          maxLength={1200}
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            setApproved(false);
          }}
        />
      </label>
      <div className="website-scope">
        <Globe size={20} />
        <div>
          <strong>Your website, built by a team</strong>
          <p>
            Vijay coordinates Aditi’s approved assets, Dev’s design and Kavya’s copy.
            Each specialist uses your approved business facts; the site is
            checked before publishing. Nisha runs trusted factual checks.
          </p>
        </div>
      </div>
      {!!vijay?.team?.length && <div className="office-team-members website-team-roster">{vijay.team.map((member) => <article key={member.id}><PixelTeammate id={memberCharacter(member)} /><div><strong>{member.name}</strong><span>{member.role}</span><small>{member.execution === "verified_code" ? "Trusted code checks · no extra model stage" : member.responsibility}</small></div></article>)}</div>}
      <label>
        Business photos{" "}
        <small>
          Optional · up to three JPEG or PNG photos, under 1.5 MB each
        </small>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            try {
              if (files.length > 3 || files.some((f) => f.size > 1500000))
                throw new Error(
                  "Choose up to three photos, under 1.5 MB each.",
                );
              const assets = await Promise.all(
                files.map(async (f) => ({
                  alt:
                    f.name
                      .replace(/\.[^.]+$/, "")
                      .replaceAll("_", " ")
                      .slice(0, 200) || "Approved business photo",
                  photo: await new Promise<string>((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = () => resolve(String(r.result).split(",")[1]);
                    r.onerror = reject;
                    r.readAsDataURL(f);
                  }),
                  rightsConfirmed: true as const,
                })),
              );
              setPhotos(assets);
              setApproved(false);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      </label>
      {!!photos.length && (
        <div className="website-photo-review">
          {photos.map((p, i) => (
            <label key={i}>
              <img
                src={`data:image/jpeg;base64,${p.photo}`}
                alt="Photo selected for owner review"
              />
              <input
                maxLength={200}
                value={p.alt}
                aria-label={`Describe business photo ${i + 1}`}
                onChange={(e) => {
                  setPhotos(
                    photos.map((a, n) =>
                      n === i ? { ...a, alt: e.target.value } : a,
                    ),
                  );
                  setApproved(false);
                }}
              />
            </label>
          ))}
        </div>
      )}
      <label className="approval-checkbox">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />{" "}
        I approve publishing these business facts, contact details and photos. I
        have rights to use the photos. My playbook has no passwords or private
        customer information.
      </label>
      <button
        className="button button-primary"
        disabled={
          busy ||
          !token ||
          !vijay ||
          !approved ||
          name.trim().length < 2 ||
          instructions.trim().length < 5 ||
          photos.some((p) => p.alt.trim().length < 2) ||
          (!!phone && !/^91[6-9]\d{9}$/.test(phone))
        }
        onClick={() =>
          run(async () => {
            await api.buildSite(token!, {
              blueprintId: vijay!.id,
              businessName: name,
              instructions,
              ...(phone ? { phone } : {}),
              assets: photos,
              publishApproved: true,
            });
            setApproved(false);
          })
        }
      >
        Build & publish with my website team <Globe size={17} />
      </button>
      <p className="small-muted">
        Your team works in the cloud. You can close the browser and return to
        the published link. Without photos, the designer creates a
        typography-led site.
      </p>
      <div className="order-list">
        {workspace?.sites
          ?.slice()
          .reverse()
          .map((site) => (
            <article key={site.id}>
              <div className="task-result-head">
                <strong>{site.businessName}</strong>
                <span className="readiness-pill">
                  {site.state.replaceAll("_", " ")}
                </span>
              </div>
              {site.reason && <p>{site.reason}</p>}
              {site.state === "published" ? (
                <>
                  <a href={site.url} target="_blank" rel="noreferrer">
                    Open live website <ExternalLink size={14} />
                  </a>
                  <button
                    className="text-button"
                    onClick={() =>
                      run(async () => {
                        await navigator.clipboard.writeText(site.url);
                        setCopied(site.id);
                      })
                    }
                  >
                    <Copy size={14} />
                    {copied === site.id ? "Copied" : "Copy website link"}
                  </button>
                  <p className="site-url">{site.url}</p>
                  <button
                    className="text-button"
                    disabled={busy || !token}
                    onClick={() =>
                      run(() => api.unpublishSite(token!, site.id))
                    }
                  >
                    Unpublish website
                  </button>
                </>
              ) : ["queued", "working"].includes(site.state) ? (
                <p role="status">
                  {site.studioCheckpoint?.stages
                    .map((s) =>
                      websiteStageName(s.stage, s.specialistName),
                    )
                    .join(" · ")}
                  {site.studioCheckpoint?.stages.length ? " · " : ""}Vijay is
                  designing and writing in the cloud. Your link appears after
                  the site is published.
                </p>
              ) : null}
            </article>
          ))}
      </div>
      <div className="quote-safety">
        <ShieldCheck size={18} />
        <p>
          Website text is rendered safely, with no generated scripts. Prices
          come from approved offers. Your public site contains no workspace
          credentials or customer records.
        </p>
      </div>
    </section>
  );
}
