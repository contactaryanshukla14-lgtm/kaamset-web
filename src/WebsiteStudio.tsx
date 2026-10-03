import {UiText} from './Language';
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { api, type WorkspaceState } from "./api";
import PixelTeammate from "./PixelTeammate";
import { memberCharacter, websiteStageName } from "./team-identity";
import { Status } from "./WorkOverview";
import {useLanguage} from './Language';
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
const {t:localize}=useLanguage();

  const {t}=useLanguage();
  const [name, setName] = useState(workspace?.business?.name || ""),
    [instructions, setInstructions] = useState(()=>{
      const team=workspace?.blueprints.find(b=>b.state==='active'&&b.plan.skills.includes('website_publish'));
      try { return team&&sessionStorage.getItem(`kaamset_website_brief_${team.id}`)||"Create a polished, mobile-friendly business website in Hinglish. Explain our offer clearly and make it easy to enquire. Keep every business claim grounded."; } catch { return "Create a polished, mobile-friendly business website from my approved facts."; }
    }),
    [phone, setPhone] = useState(""),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState("");
  const [readingPhotos, setReadingPhotos] = useState(false);
  const [withoutPhotos,setWithoutPhotos]=useState(false);
  const requestAttempt=useRef<{signature:string;key:string}|null>(null);
  const uploadSequence = useRef(0);
  const inFlight = useRef(false);
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
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  const phoneInvalid = !!phone && !/^91[6-9]\d{9}$/.test(phone);
  const sites = workspace?.sites?.slice().reverse() || [];
  return (
    <section className="merchant-tool website-studio" aria-labelledby="website-studio-title">
      <header className="studio-head">
        <PixelTeammate
          id="vijay"
          name="Vijay"
          state={busy || cloudWorking ? "working" : "idle"}
        />
        <div>
          <h2 id="website-studio-title"><UiText text={"Vijay’s website team"}/></h2>
          <p>
            <UiText text={"Give the team your brief and photos. They design, write and check a mobile-friendly site from your approved facts, then publish it to a link you can share."}/></p>
          {!!vijay?.team?.length && (
            <ul className="studio-roster" aria-label={localize("Website team")}>
              {vijay.team.map((member) => (
                <li key={member.id}>
                  <PixelTeammate id={memberCharacter(member)} name={member.name} />
                  <span><strong>{member.name}</strong><small>{member.execution === "verified_code" ? "Code checks" : member.role}</small></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      {error && (
        <p className="office-error" role="alert">
          {error}
        </p>
      )}
      {!vijay && (
        <div className="studio-setup">
          <div>
            <strong><UiText text={"Activate Vijay’s team first."}/></strong>
            <p>
              <UiText text={"It uses your approved business description as its source and checks the job before building."}/></p>
          </div>
          <button type="button" className="office-primary" onClick={onBuild}>
            <UiText text={"Set up Vijay’s team "}/><ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="studio-columns">
      <div className="studio-form">
      <section className="studio-step" aria-labelledby="studio-step-brief">
      <h3 id="studio-step-brief"><b aria-hidden="true">1</b><UiText text={"What goes on the site"}/></h3>
      <div className="merchant-form-grid">
        <label>
          <UiText text={"Public business name"}/><input
            maxLength={80}
            value={name}
            placeholder={localize("Your business name")}
            onChange={(e) => {
              setName(e.target.value);
              setApproved(false);
            }}
          />
        </label>
        <label>
          <UiText text={"Public WhatsApp number "}/><small><UiText text={"Optional"}/></small>
          <input
            value={phone}
            inputMode="tel"
            placeholder={localize("91 and your 10-digit number")}
            maxLength={12}
            aria-invalid={phoneInvalid}
            aria-describedby="studio-phone-help"
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setApproved(false);
            }}
          />
        </label>
      </div>
      <p id="studio-phone-help" role={phoneInvalid ? 'alert' : undefined} className={phoneInvalid ? "studio-help is-error" : "studio-help"}><UiText text={phoneInvalid ? "Use 91 followed by a 10-digit mobile number, for example 919876543210." : "How customers reach you. Leave it empty to use the contact details in your business description. Your private account details are never published."}/></p>
      <label>
        <UiText text={"What should the website feel like?"}/><textarea
          rows={4}
          maxLength={1200}
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            setApproved(false);
          }}
        />
      </label>
      </section>
      <section className="studio-step" aria-labelledby="studio-step-assets">
      <h3 id="studio-step-assets"><b aria-hidden="true">2</b><UiText text={"Logo and photos"}/></h3>
      <p className="studio-help"><UiText text={"Aditi chooses from what you add: your logo, shop, products or work. Up to three JPEG or PNG files, under 1.5 MB each."}/></p>
      {!!workspace?.businessAssets?.length&&<button type="button" className="office-secondary" disabled={busy||readingPhotos} onClick={()=>void run(async()=>{const result=await api.businessAssets(token!);setPhotos(result.assets.map(a=>({alt:a.alt,photo:a.src.split(',')[1],rightsConfirmed:true})));setApproved(false);setWithoutPhotos(false)})}>{t('Use my saved business images')}</button>}
      <label className={`studio-drop ${busy || readingPhotos ? "is-disabled" : ""}`}>
        <Upload size={20} aria-hidden="true" />
        <span><strong><UiText text={photos.length ? "Choose different photos" : "Choose photos"}/></strong><small>{photos.length ? `${photos.length} of 3 selected` : "Up to 3 files"}</small></span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          disabled={busy || readingPhotos}
          onChange={async (e) => {
            const sequence = ++uploadSequence.current;
            setApproved(false); setWithoutPhotos(false); setReadingPhotos(true); setError("");
            const files = Array.from(e.target.files || []);
            try {
              if (files.length > 3 || files.some((f) => f.size > 1500000 || !["image/jpeg", "image/png"].includes(f.type)))
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
              if (sequence === uploadSequence.current) setPhotos(assets);
              setApproved(false);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              if (sequence === uploadSequence.current) setReadingPhotos(false);
            }
          }}
        />
      </label>
      {!photos.length&&<label className="office-check studio-no-photos"><input type="checkbox" checked={withoutPhotos} disabled={busy||readingPhotos} onChange={e=>{setWithoutPhotos(e.target.checked);setApproved(false)}}/><span><UiText text={"I don’t have photos yet. Build a clean, text-led site from my business facts."}/></span></label>}
      {readingPhotos && <p className="studio-help" role="status"><LoaderCircle size={14} className="spin" aria-hidden="true" /> <UiText text={"Preparing your photos for review…"}/></p>}
      {!!photos.length && (
        <div className="website-photo-review">
          {photos.map((p, i) => (
            <figure key={i}>
              <img
                src={`data:image/jpeg;base64,${p.photo}`}
                alt={`Selected photo ${i + 1}`}
              />
              <label>
                <UiText text={"Describe photo "}/>{i + 1}
                <input
                  maxLength={200}
                  value={p.alt}
                  aria-invalid={p.alt.trim().length < 2}
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
              <button type="button" className="office-text" disabled={busy || readingPhotos} onClick={() => {setPhotos(photos.filter((_,n)=>n!==i));setApproved(false);setWithoutPhotos(false)}}><Trash2 size={14} aria-hidden="true" /><UiText text={"Remove photo "}/>{i+1}</button>
            </figure>
          ))}
        </div>
      )}
      </section>
      <section className="studio-step studio-approve" aria-labelledby="studio-step-approve">
      <h3 id="studio-step-approve"><b aria-hidden="true">3</b><UiText text={"Approve and publish"}/></h3>
      <ul className="studio-checklist" aria-label={localize("Before publishing")}>
        <li className={name.trim().length >= 2 && instructions.trim().length >= 5 && !phoneInvalid ? "is-done" : ""}><UiText text={"Name and brief"}/></li>
        <li className={photos.length || withoutPhotos ? "is-done" : ""}>{photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""} described` : withoutPhotos ? "No photos, text-led site" : "Photos, or the no-photo choice"}</li>
        <li className={approved ? "is-done" : ""}><UiText text={"Your approval"}/></li>
      </ul>
      <label className="office-check">
        <input
          type="checkbox"
          checked={approved}
          disabled={busy || readingPhotos || !!cloudWorking}
          onChange={(e) => setApproved(e.target.checked)}
        />
        <span>
          <UiText text={"I approve publishing these business facts, contact details and photos. I have rights to use the photos. My business description has no passwords or private customer information."}/></span>
      </label>
      <button
        type="button"
        className="office-primary"
        disabled={
          busy ||
          readingPhotos ||
          !!cloudWorking ||
          !token ||
          !vijay ||
          !approved ||
          (!photos.length&&!withoutPhotos) ||
          name.trim().length < 2 ||
          instructions.trim().length < 5 ||
          photos.some((p) => p.alt.trim().length < 2) ||
          phoneInvalid
        }
        onClick={() =>
          run(async () => {
            const signature=JSON.stringify({name,instructions,phone,photos:photos.map(p=>({alt:p.alt,photo:p.photo}))});
            if(requestAttempt.current?.signature!==signature)requestAttempt.current={signature,key:crypto.randomUUID()};
            await api.buildSite(token!, {
              blueprintId: vijay!.id,
              businessName: name,
              instructions,
              ...(phone ? { phone } : {}),
              assets: photos,
              publishApproved: true,
            },requestAttempt.current.key);
            setApproved(false);
          })
        }
      >
        {busy ? <LoaderCircle size={17} className="spin" aria-hidden="true" /> : <Globe size={17} aria-hidden="true" />}
        <UiText text={cloudWorking ? "Your website team is working…" : busy ? "Sending to your website team…" : "Build and publish my website"}/>
      </button>
      <p className="studio-help">
        <UiText text={"The team works in the cloud, so you can close this page. Your link appears on the right once the site is published."}/></p>
      </section>
      </div>
      <aside className="studio-results" aria-labelledby="studio-results-title">
        <h3 id="studio-results-title"><UiText text={"Your websites"}/></h3>
        {!sites.length && (
          <div className="studio-empty">
            <Globe size={22} aria-hidden="true" />
            <p><UiText text={"No website yet. When you publish, the team’s progress and your live link appear here."}/></p>
          </div>
        )}
        {sites.map((site) => (
          <article key={site.id} className={`studio-site is-${site.state}`}>
            <div className="studio-site-head">
              <strong>{site.businessName}</strong>
              <Status value={site.state} />
            </div>
            {["queued", "working"].includes(site.state) && (
              <div className="studio-progress" role="status">
                <span className="business-live-bar" aria-hidden="true" />
                <ol>
                  {(site.studioCheckpoint?.stages || []).map((s) => (
                    <li key={s.stage} className="is-done"><Check size={12} aria-hidden="true" />{websiteStageName(s.stage, s.specialistName)}</li>
                  ))}
                  <li className="is-working"><i aria-hidden="true" /><UiText text={site.state === "queued" ? "Waiting for a cloud worker" : "Designing and writing"}/></li>
                </ol>
                <p><UiText text={"Your link appears here after the site is published. Closing this page does not stop the job."}/></p>
              </div>
            )}
            {site.reason && <p className="studio-site-reason">{site.reason}</p>}
            {site.state === "published" && (
              <div className="studio-live">
                <span className="studio-live-label"><UiText text={"Live link"}/></span>
                <p className="site-url">{site.url}</p>
                <div className="studio-live-actions">
                  <a className="office-primary" href={site.url} target="_blank" rel="noreferrer">
                    <UiText text={"Open website "}/><ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    className="office-secondary"
                    onClick={() =>
                      run(async () => {
                        await navigator.clipboard.writeText(site.url);
                        setCopied(site.id);
                      })
                    }
                  >
                    {copied === site.id ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    <UiText text={copied === site.id ? "Copied" : "Copy link"}/>
                  </button>
                  <button
                    type="button"
                    className="office-text studio-unpublish"
                    disabled={busy || !token}
                    onClick={() =>
                      run(() => api.unpublishSite(token!, site.id))
                    }
                  >
                    <UiText text={"Unpublish website"}/></button>
                </div>
              </div>
            )}
          </article>
        ))}
      </aside>
      </div>
      <div className="quote-safety">
        <ShieldCheck size={18} aria-hidden="true" />
        <p>
          <UiText text={"Your team uses the business facts and prices you approved. Customer records and login details stay private."}/></p>
      </div>
    </section>
  );
}
