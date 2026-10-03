import {UiText} from './Language';
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  FileText,
  ShoppingBag,
  Wallet,
  BookOpen,
  TrendingUp,
  Globe,
  Instagram,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  Mail,
  Menu,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  api,
  type BusinessSetup,
  type Teammate,
  type WorkspaceState,
} from "./api";
import PixelTeammate from "./PixelTeammate";
const InboxPanel = lazy(() => import("./InboxPanel"));
const WebsiteStudio = lazy(() => import("./WebsiteStudio"));
const WhatsAppSalesDesk = lazy(() => import("./WhatsAppSalesDesk"));
import DeskLoading from "./DeskLoading";
import { memberCharacter, teamName, websiteStageName } from "./team-identity";
import { BusinessMemory, ContentStudio, VoiceInput } from "./OwnerTools";
import {LanguagePicker,useLanguage} from './Language';
import SiaAssistant,{showSia} from './SiaAssistant';
import {AssetPicker,SavedBusinessAssets} from './BusinessAssets';
import type {BusinessAssetInput} from './api';
import {
  Catalogue,
  MilanScheduler,
  OrderDesk,
} from "./MerchantTools";
import {readyTeams,selectedReadyTeam,ReadyTeamGallery,ReadyTeamSetup,merchantCodes,teamLead,teamRole,type ReadyTeamId} from "./ReadyTeams";
import WorkOverview, { Status } from "./WorkOverview";
import MerchantOps,{type OpsPage} from "./MerchantOps";
import UpiSettings from "./UpiSettings";
const TeammateTask = lazy(() => import("./TeammateTask"));
const TeamIdentity = lazy(() => import("./TeamIdentity"));
const BusinessStart = lazy(() => import("./BusinessStart"));
const CopyItems = lazy(() => import("./CopyItems"));
import "./office.css";
import "./office-system.css";

const storageKey = "kaamset_merchant_workspace_token";
const legacyStorageKey = "kaamset_workspace_token";
const pageKey = "kaamset_merchant_page";
const connectionAttemptKey = "kaamset_connection_attempt";

function restoredPage(): Page {
  if (["instagram", "gmail", "googlecalendar", "googlesheets"].includes(new URLSearchParams(location.search).get("connected") || "")) return "connections";
  const value = sessionStorage.getItem(pageKey);
  return pages.some((p) => p.id === value) ? value as Page : "work";
}

function ResultText({ text }: { text: string }) {
  const inline = (value: string) =>
    value
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      );
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  const heading = /^\s*#{1,6}\s+/;
  const bullet = /^\s*[-*]\s+/;
  const numbered = /^\s*\d+\.\s+/;
  const rule = /^\s*---\s*$/;
  for (let index = 0; index < lines.length;) {
    const key = index, line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (heading.test(line)) {
      blocks.push(<h4 key={key}>{inline(line.replace(heading, ""))}</h4>);
      index++; continue;
    }
    if (rule.test(line)) { blocks.push(<hr key={key} />); index++; continue; }
    if (bullet.test(line) || numbered.test(line)) {
      const marker = bullet.test(line) ? bullet : numbered;
      const items: ReactNode[] = [];
      while (index < lines.length && marker.test(lines[index])) {
        items.push(<li key={index}>{inline(lines[index].replace(marker, ""))}</li>);
        index++;
      }
      blocks.push(marker === bullet ? <ul key={key}>{items}</ul> : <ol key={key}>{items}</ol>);
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() &&
      !heading.test(lines[index]) && !bullet.test(lines[index]) &&
      !numbered.test(lines[index]) && !rule.test(lines[index])) {
      paragraph.push(lines[index++]);
    }
    blocks.push(<p key={key}>{inline(paragraph.join("\n"))}</p>);
  }
  return <div className="office-result">{blocks}</div>;
}
type Page =
  | "work"
  | "team"
  | "counter" | "shop" | "khata" | "money" | "requests"
  | "customers"
  | "whatsapp"
  | "marketing"
  | "website"
  | "assistant"
  | "orders"
  | "connections"
  | "business";
const pages = [
  { id: "work", label: "My work", Icon: LayoutDashboard },
  { id: "team", label: "My AI team", Icon: Users },
  {id:"counter",label:"Arjun · Counter",Icon:ShoppingBag},
  {id:"shop",label:"Tara · Online dukaan",Icon:Globe},
  {id:"khata",label:"Naina · Khata",Icon:BookOpen},
  {id:"money",label:"Money desk",Icon:Wallet},
  {id:"requests",label:"Customer requests",Icon:TrendingUp},
  { id: "customers", label: "Customer desk", Icon: MessageCircle },
  { id: "whatsapp", label: "Aarav · WhatsApp", Icon: MessageCircle },
  { id: "marketing", label: "Instagram studio", Icon: Instagram },
  { id: "website", label: "Website team", Icon: Globe },
  { id: "assistant", label: "Milan · Assistant", Icon: Activity },
  { id: "orders", label: "Orders & payments", Icon: FileText },
  { id: "connections", label: "Connections", Icon: Link2 },
  { id: "business", label: "Business & memory", Icon: Brain },
] as const;
const languageOptions = [
  "Hinglish",
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
];
const initial: BusinessSetup = {
  name: "",
  category: "",
  city: "",
  language: "Hinglish",
  description: "",
  goal: `Ready team: ${selectedReadyTeam(new URLSearchParams(location.search).get("team")) || "sia"}`,
  contact: "",
  rules:
    "Ask me about discounts, complaints, stock and delivery exceptions. Never invent business facts.",
  approved: true,
};
const label = (s: string) => s.replaceAll("_", " ");
const setupSteps = ["Your business", "In your words", "Team & approval"];
function Brand() {
const {t:localize}=useLanguage();

  return (
    <a className="office-brand" href="/" aria-label={localize("KaamSet home")}>
      <span className="office-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      <strong>
        <UiText text={"kaam"}/><span><UiText text={"set"}/></span>
      </strong>
    </a>
  );
}
function Setup({
  busy,
  onFinish,
  onSignIn,
  getSetupToken,
}: {
  busy: string;
  onFinish: (setup: BusinessSetup) => Promise<void>;
  onSignIn: () => void;
  getSetupToken:()=>Promise<string>;
}) {
const {t:localize}=useLanguage();

  const {language,t}=useLanguage();
  const [assets,setAssets]=useState<BusinessAssetInput[]>([]),[assetRights,setAssetRights]=useState(false);
  const [readingAssets,setReadingAssets]=useState(false);
  const [step, setStep] = useState(0),
    [setup, setSetup] = useState<BusinessSetup>(() => {
      try {
        return {
          ...initial,
          ...JSON.parse(sessionStorage.getItem("kaamset_setup_draft") || "{}"),
        };
      } catch {
        return initial;
      }
    }),
    [approved, setApproved] = useState(false),
    [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null),
    stepHeading = useRef<HTMLHeadingElement>(null);
  const previousUiLanguage=useRef(language);
  useEffect(()=>{if(previousUiLanguage.current!==language){previousUiLanguage.current=language;field('language',language)}},[language]);
  useEffect(() => {
    if (step === 2) stepHeading.current?.focus();
  }, [step]);
  function field(key: keyof BusinessSetup, value: string) {
    const next = { ...setup, [key]: value };
    setSetup(next);
    sessionStorage.setItem("kaamset_setup_draft", JSON.stringify(next));
    setApproved(false);
  }
  const valid =
    step === 0
      ? setup.name.trim().length >= 2 && setup.category.trim().length >= 2
      : step === 1
        ? setup.description.trim().length >= 20
        : setup.goal.trim().length >= 10 && approved;
  async function next(e: FormEvent) {
    e.preventDefault();
    if(busy||readingAssets)return;
    if(!valid||step===2&&assets.length>0&&(!assetRights||assets.some(a=>a.alt.trim().length<2))){setError('Check the required fields and approvals before continuing.');showSia('field','Check the required fields and approvals before continuing.');return;}
    if (step < 2) setStep(step + 1);
    else await onFinish({...setup,...(assets.length?{assets}:{} )});
  }
  function voice(key:'name'|'category'|'city'|'description'|'rules'){return <VoiceInput token={null} getToken={getSetupToken} enabled onText={text=>{field(key,text.slice(0,key==='description'?5000:key==='rules'?2000:80));setError('')}} onError={setError} label={`Speak ${key==='description'?'business description':key==='rules'?'your rules':key==='category'?'business type':key==='name'?'business name':'city'}`}/>;}
  const chosen = readyTeams.find((team) => setup.goal === `Ready team: ${team.code}`);
  const teamOption = (team: (typeof readyTeams)[number]) => {
    const on = setup.goal === `Ready team: ${team.code}`;
    return (
      <button className="ready-onboarding-option" type="button" key={team.code} aria-pressed={on} onClick={() => field("goal", `Ready team: ${team.code}`)}>
        <span className="ready-onboarding-portrait" aria-hidden="true"><PixelTeammate id={team.id} name={teamLead(team)} /></span>
        <span><strong>{teamLead(team)} <em>{t(teamRole(team))}</em></strong><small>{t(team.tag)}</small></span>
        {on && <Check className="ready-onboarding-check" size={16} aria-hidden="true" />}
      </button>
    );
  };
  return (
    <div className="office-onboarding">
      <header>
        <Brand />
        <LanguagePicker/>
        <button type="button" className="office-text" onClick={onSignIn}>
          <UiText text={"Have a saved workspace? Sign in "}/><ArrowUpRight size={15} />
        </button>
      </header>
      <main className="office-welcome">
        <aside className="office-story">
          <h1>
            <UiText text={"Apni team chuniye."}/><span><UiText text={"Team sambhal legi."}/></span>
          </h1>
          <p>
            <UiText text={"Describe your business once. Pick a ready team for billing, udhaar, customers, Instagram or your website. It prepares the work; you approve what goes out."}/></p>
          <div className="onboarding-crew" aria-hidden="true">
            {[["baba", "Arjun", "Counter"], ["ma", "Naina", "Khata"], ["chotu", "Sia", "Advisor"], ["tara", "Tara", "Dukaan"], ["vijay", "Vijay", "Website"]].map(([id, name, job]) => (
              <figure key={id}>
                <PixelTeammate id={id} name={name} />
                <figcaption>{name}<small>{t(job)}</small></figcaption>
              </figure>
            ))}
          </div>
          <ul className="onboarding-promises">
            <li><MessageCircle size={17} aria-hidden="true" /><span><UiText text={"Write the way you speak. Hindi, Hinglish or English is fine."}/></span></li>
            <li><ShieldCheck size={17} aria-hidden="true" /><span><UiText text={"Replies, posts and payment requests wait for your approval and your connected accounts."}/></span></li>
            <li><Cloud size={17} aria-hidden="true" /><span><UiText text={"Approved jobs keep running in the cloud after you close this page."}/></span></li>
          </ul>
        </aside>
        <section className="office-setup-card" aria-labelledby="setup-step-title">
          <ol className="setup-progress" aria-label={localize("Setup progress")}>
            {setupSteps.map((name, n) => (
              <li key={name} className={n < step ? "is-done" : n === step ? "is-current" : ""} aria-current={n === step ? "step" : undefined}>
                <i aria-hidden="true">{n < step ? <Check size={12} /> : n + 1}</i>
                <span>{t(name)}</span>
              </li>
            ))}
          </ol>
          <p className="setup-progress-text"><UiText text={"Step "}/>{step + 1} <UiText text={"of 3"}/></p>
          <form onSubmit={next}>
            <p className="setup-voice-note">{t('You can type or speak each answer. Review the words before continuing.')}</p>
            <div className="setup-step-panel" key={step}>
            {step === 0 ? (
              <>
                <h2 id="setup-step-title"><UiText text={"What’s your business?"}/></h2>
                <p><UiText text={"Just the basics. You can change these later."}/></p>
                <label>
                  <UiText text={"Business name"}/><input
                    autoFocus
                    value={setup.name}
                    onChange={(e) => field("name", e.target.value)}
                    maxLength={80}
                    minLength={2}
                    placeholder={localize("e.g. Asha Studio")}
                    required
                  />
                </label>
                {voice('name')}
                <label>
                  <UiText text={"What kind of business?"}/><input
                    value={setup.category}
                    onChange={(e) => field("category", e.target.value)}
                    maxLength={80}
                    minLength={2}
                    placeholder={localize("Chai stall, kirana, salon, tailoring…")}
                    required
                  />
                </label>
                {voice('category')}
                <div className="office-form-row">
                  <label>
                    <UiText text={"City or area "}/><small><UiText text={"Optional"}/></small>
                    <input
                      value={setup.city}
                      onChange={(e) => field("city", e.target.value)}
                      maxLength={80}
                      placeholder={localize("e.g. Pune")}
                    />
                  </label>
                  <label>
                    <UiText text={"Language you prefer"}/><select
                      value={setup.language}
                      onChange={(e) => field("language", e.target.value)}
                    >
                      {languageOptions.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {voice('city')}
              </>
            ) : step === 1 ? (
              <>
                <h2 id="setup-step-title"><UiText text={"Tell us about it, in your words."}/></h2>
                <p>
                  <UiText text={"Explain it like you would to a new helper at the counter."}/></p>
                <ul className="setup-prompts" aria-label={localize("Things worth mentioning")}>
                  <li><UiText text={"What you sell"}/></li>
                  <li><UiText text={"Who buys from you"}/></li>
                  <li><UiText text={"What takes most of your time"}/></li>
                </ul>
                <label htmlFor="setup-description">
                  <span id="setup-description-label"><UiText text={"Your business, in your own words"}/></span>
                  <textarea
                    id="setup-description"
                    aria-labelledby="setup-description-label"
                    autoFocus
                    value={setup.description}
                    rows={7}
                    maxLength={5000}
                    minLength={20}
                    aria-describedby="setup-description-count"
                    onChange={(e) => field("description", e.target.value)}
                    placeholder={localize("Main Pune mein chai aur snacks ka stall chalata hoon. Office customers WhatsApp par order poochte hain. Subah bahut busy hota hoon, payment aur udhaar ka record sambhalna mushkil hota hai…")}
                    required
                  />
                  <small id="setup-description-count" className="setup-count">
                    {setup.description.trim().length < 20
                      ? t('Please add {count} more characters.').replace('{count}',String(20 - setup.description.trim().length))
                      : t('{count} / 5,000 characters').replace('{count}',setup.description.length.toLocaleString('en-IN'))}
                  </small>
                </label>
                {voice('description')}
                <input
                  type="file"
                  hidden
                  ref={file}
                  accept=".md,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 50000) {
                      setError("Use a brief under 50 KB.");
                      return;
                    }
                    const text = await f.text();
                    if (text.length > 5000) {
                      setError("Keep the setup brief under 5,000 characters.");
                      return;
                    }
                    field("description", text);
                  }}
                />
                <button
                  type="button"
                  className="office-text"
                  onClick={() => file.current?.click()}
                >
                  <Upload size={15} /> <UiText text={"Use my business brief (.md / .txt)"}/></button>
                <label>
                  <UiText text={"Public contact "}/><small><UiText text={"Optional"}/></small>
                  <input
                    value={setup.contact}
                    onChange={(e) => field("contact", e.target.value)}
                    maxLength={150}
                    placeholder={localize("Business phone or email")}
                  />
                </label>
                <AssetPicker assets={assets} onChange={a=>{setAssets(a);setAssetRights(false);setApproved(false)}} onError={setError} onBusyChange={setReadingAssets}/>
              </>
            ) : (
              <>
                <h2 id="setup-step-title" ref={stepHeading} tabIndex={-1}><UiText text={"Pick your first team, then approve."}/></h2>
                <p><UiText text={"All 12 ready teams share what you wrote. Start with one; add others any time. No payment account is needed to start."}/></p>
                <label className="setup-team-picker"><UiText text={"Your first ready team"}/><select aria-label={localize("Your first ready team")} value={chosen?.code || ""} onChange={e=>field("goal",`Ready team: ${e.target.value}`)}>
                    <option value="" disabled><UiText text={"Choose a team"}/></option>
                    <optgroup label={localize("Everyday shop work")}>{readyTeams.filter(team=>merchantCodes.includes(team.code)).map(team=><option key={team.code} value={team.code}>{teamLead(team)} · {t(teamRole(team))}</option>)}</optgroup>
                    <optgroup label={localize("Customers & growth")}>{readyTeams.filter(team=>!merchantCodes.includes(team.code)).map(team=><option key={team.code} value={team.code}>{teamLead(team)} · {t(teamRole(team))}</option>)}</optgroup>
                  </select>
                </label>
                {[
                  { title: "Everyday shop work", list: readyTeams.filter((t) => merchantCodes.includes(t.code)) },
                  { title: "Customers & growth", list: readyTeams.filter((t) => !merchantCodes.includes(t.code)) },
                ].map((group) => (
                  <div className="setup-team-group" key={group.title} role="group" aria-label={group.title}>
                    <h3>{group.title}</h3>
                    <div className="ready-onboarding-grid">{group.list.map(teamOption)}</div>
                  </div>
                ))}
                {chosen && (
                  <div className="setup-team-detail" aria-live="polite">
                    <span className="ready-onboarding-portrait"><PixelTeammate id={chosen.id} name={teamLead(chosen)} /></span>
                    <div>
                      <strong>{chosen.name}</strong>
                      <p>{t(chosen.description)}</p>
                      <small><Link2 size={13} aria-hidden="true" /> {t(chosen.connection)}</small>
                    </div>
                  </div>
                )}
                <section className="setup-approval" aria-labelledby="setup-approval-title">
                  <h3 id="setup-approval-title"><UiText text={"Check and approve"}/></h3>
                  <dl>
                    <div><dt><UiText text={"Business"}/></dt><dd>{setup.name}, {setup.category}{setup.city.trim() ? `, ${setup.city}` : ""}</dd></div>
                    <div><dt><UiText text={"Language"}/></dt><dd>{setup.language}</dd></div>
                    <div><dt><UiText text={"First team"}/></dt><dd>{chosen?.name || "Not chosen"}</dd></div>
                    <div className="setup-approval-words"><dt><UiText text={"In your words"}/></dt><dd>{setup.description.trim().slice(0, 180)}<UiText text={setup.description.trim().length > 180 ? "…" : ""}/></dd></div>
                  </dl>
                  <label>
                    <UiText text={"When should your team ask you first?"}/><textarea
                      rows={2}
                      maxLength={2000}
                      value={setup.rules}
                      onChange={(e) => field("rules", e.target.value)}
                    />
                  </label>
                  {voice('rules')}
                  {!!assets.length&&<label className="office-check"><input type="checkbox" checked={assetRights} onChange={e=>setAssetRights(e.target.checked)}/><span>{t('I own or have permission to use these images. They stay private until I approve publishing.')}</span></label>}
                  <label className="office-check setup-approval-check">
                    <input
                      type="checkbox"
                      checked={approved}
                      onChange={(e) => setApproved(e.target.checked)}
                    />
                    <span>
                      <UiText text={"These facts are correct. My team may use them to prepare work. Anything sent, posted or charged still needs my approval."}/></span>
                  </label>
                </section>
              </>
            )}
            </div>
            {error && (
              <p className="office-error" role="alert">
                {error}
              </p>
            )}
            <div className="setup-buttons">
              {step > 0 && (
                <button
                  type="button"
                  className="office-secondary"
                  disabled={!!busy}
                  onClick={() => setStep(step - 1)}
                >
                  <UiText text={"Back"}/></button>
              )}
              <button className="office-primary" disabled={!!busy||readingAssets}>
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={16} />
                    {busy}
                  </>
                ) : (
                  <>
                    <UiText text={step === 2 ? "Approve and open my office" : "Continue"}/>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
            <p className="office-footnote">
              <UiText text={"No account needed to start. Verify your email later to keep this workspace on any device."}/></p>
          </form>
        </section>
      </main>
    </div>
  );
}
function AccountDialog({
  token,
  saved,
  onClose,
  onToken,
  resetToken,
}: {
  token: string | null;
  saved: boolean;
  onClose: () => void;
  onToken: (token: string) => void;
  resetToken?: string | null;
}) {
const {t:localize}=useLanguage();

  const [mode, setMode] = useState<"register" | "login" | "recover" | "reset">(
      resetToken ? "reset" : token && !saved ? "register" : "login",
    ),
    [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [choices, setChoices] = useState<{ tenantId: string; business: string }[]>(
      [],
    ),
    [tenantId, setTenantId] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.account(
        mode,
        mode === "register"
          ? { email, name, password, workspaceToken: token }
          : mode === "recover"
            ? { email }
            : mode === "reset"
              ? { token: resetToken, password }
              : {
                  email,
                  password,
                  ...(code ? { mfaCode: code } : {}),
                  ...(tenantId ? { tenantId } : {}),
                },
      );
      setPassword("");
      if (r.token) {
        onToken(r.token);
        onClose();
      } else if (r.workspaces) {
        setChoices(r.workspaces);
        setMessage("Choose your workspace and enter your password again.");
      } else if (mode === "recover")
        setMessage(
          "If your email has an active account, a password reset link will arrive shortly.",
        );
      else if (mode === "reset") {
        setMode("login");
        setMessage("Password updated. Sign in again.");
      } else
        setMessage(
          "Check your inbox. Use the verification link within 30 minutes to save this workspace.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const node = document.querySelector<HTMLElement>(".office-modal");
    node?.querySelector<HTMLInputElement>("input")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && node) {
        const items = Array.from(
          node.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]",
          ),
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="office-modal-overlay">
      <section
        className="office-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
      >
        <button
          className="office-close"
          aria-label={localize("Close account dialog")}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="office-eyebrow"><UiText text={"YOUR BUSINESS WORKSPACE"}/></span>
        <LanguagePicker/>
        <h2 id="account-title">
          <UiText text={mode === "register"
            ? "Save your office. Come back anytime."
            : mode === "recover"
              ? "Recover your account."
              : mode === "reset"
                ? "Choose a new password."
                : "Welcome back."}/>
        </h2>
        <p>
          <UiText text={mode === "register"
            ? "Verify your email to recover your team, work and connections on another device."
            : "Sign in to your saved business workspace."}/>
        </p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              <UiText text={"Your name"}/><input
                required
                autoComplete="name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              <UiText text={"Email"}/><input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {mode !== "recover" && (
            <label>
              <UiText text={"Password"}/><input
                required
                type="password"
                minLength={mode === "register" || mode === "reset" ? 12 : 1}
                maxLength={256}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {mode === "register" || mode === "reset" ? (
            <small><UiText text={"Use at least 12 characters."}/></small>
          ) : (
            mode === "login" && (
              <label>
                <UiText text={"Authenticator code "}/><small><UiText text={"If enabled"}/></small>
                <input
                  inputMode="numeric"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            )
          )}
          {choices.length > 0 && (
            <label>
              <UiText text={"Business"}/><select
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value=""><UiText text={"Choose your business"}/></option>
                {choices.map((c) => (
                  <option key={c.tenantId} value={c.tenantId}>
                    {c.business}
                  </option>
                ))}
              </select>
            </label>
          )}
          {message && (
            <p className="office-notice" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="office-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="office-primary"
            disabled={busy || (mode === "register" && !token)}
          >
            <UiText text={busy
              ? "Please wait…"
              : mode === "register"
                ? "Send verification email"
                : mode === "recover"
                  ? "Send recovery link"
                  : mode === "reset"
                    ? "Update password"
                    : "Sign in"}/>
            <ArrowRight size={16} />
          </button>
        </form>
        {mode !== "register" && (
          <button
            className="office-text"
            onClick={() => {
              setMode(mode === "login" ? "recover" : "login");
              setError("");
              setMessage("");
            }}
          >
            <UiText text={mode === "login" ? "Forgot your password?" : "Back to sign in"}/>
          </button>
        )}
        {token && !saved && (
          <button
            className="office-text"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
              setMessage("");
            }}
          >
            <UiText text={mode === "register"
              ? "I already have an account"
              : "Save this workspace instead"}/>
          </button>
        )}
      </section>
    </div>
  );
}
function PaymentSettings({
  token,
  workspace,
  onChange,
  onSaveAccount,
}: {
  token: string;
  workspace: WorkspaceState;
  onChange: () => Promise<unknown>;
  onSaveAccount: () => void;
}) {
const {t:localize}=useLanguage();

  const [mid, setMid] = useState(""),
    [merchantKey, setKey] = useState(""),
    [mode, setMode] = useState<"staging" | "production">(workspace.paymentSetup?.mode || "staging"),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [changing, setChanging] = useState(!workspace.paymentSetup?.configured);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !approved) return;
    setBusy(true);
    setError("");
    try {
      await api.paymentSetup(token, {
        mid,
        merchantKey,
        mode,
        websiteName: mode === "staging" ? "WEBSTAGING" : "DEFAULT",
        ownerConfirmed: true,
      });
      setKey("");
      setMid("");
      setApproved(false);
      setChanging(false);
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="office-card office-payment">
      <div className="office-card-head">
        <span className="paytm-wordmark">
          <UiText text={"pay"}/><span><UiText text={"tm"}/></span>
        </span>
        <Status
          value={
            workspace.paymentSetup?.configured ? "configured" : "setup_needed"
          }
        />
      </div>
      <h3><UiText text={workspace.paymentSetup?.configured ? "Paytm Checkout settings are saved." : "Add Paytm Checkout for automatic verification."}/></h3>
      <p>
        <UiText text={"Send an accepted order’s payment request, let the customer pay, then verify the transaction with Paytm before marking it collected."}/></p>
      {workspace.paymentSetup && (
        <p className="office-notice">
          <UiText text={workspace.paymentSetup.mode === "staging"
            ? "Test merchant"
            : "Live merchant"}/>{" "}
          <UiText text={"· MID ending "}/>{workspace.paymentSetup.midSuffix}<UiText text={". Payment verification happens with Paytm."}/></p>
      )}
      {!workspace.account?.saved ? (
        <div><p className="office-footnote"><UiText text={"Save your business with a verified email first, so only you can recover its payment connection."}/></p><button className="office-secondary" onClick={onSaveAccount}>
          <UiText text={"Save your business account to connect Paytm "}/><ChevronRight size={16} />
        </button></div>
      ) : (!workspace.paymentSetup?.configured || changing) ? (
        <form onSubmit={submit}>
          <div className="office-form-row">
            <label>
              <UiText text={"Payment mode"}/><select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as "staging" | "production");
                  setApproved(false);
                }}
              >
                <option value="staging"><UiText text={"Test payments"}/></option>
                <option value="production"><UiText text={"Live payments"}/></option>
              </select>
            </label>
            <label>
              <UiText text={"Merchant ID"}/><input
                value={mid}
                required
                maxLength={40}
                autoComplete="off"
                placeholder={localize("MID from your Paytm dashboard")}
                onChange={(e) => { setMid(e.target.value); setApproved(false); }}
              />
            </label>
          </div>
          <label>
            <UiText text={"Merchant key"}/><input
              type="password"
              value={merchantKey}
              required
              minLength={16}
              maxLength={16}
              autoComplete="new-password"
              placeholder={localize("16-character merchant key")}
              onChange={(e) => { setKey(e.target.value); setApproved(false); }}
            />
          </label>
          <label className="office-check">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            <span>
              <UiText text={mode === "production"
                ? "I am authorised to use this live merchant account. Customer-accepted requests may collect real payments."
                : "I am authorised to use this test merchant account."}/>
            </span>
          </label>
          {error && <p className="office-error">{error}</p>}
          <button className="office-primary" disabled={busy || !approved}>
            <UiText text={busy ? "Saving securely…" : "Save Paytm connection"}/>
            <ShieldCheck size={16} />
          </button>
        </form>
      ) : <button className="office-secondary" onClick={() => setChanging(true)}><UiText text={"Change Paytm connection "}/><Settings size={14} /></button>}
      <a
        href="https://dashboard.paytmpayments.com/login/"
        target="_blank"
        rel="noreferrer"
        className="office-text"
      >
        <UiText text={"Find your merchant credentials in Paytm "}/><ArrowUpRight size={14} />
      </a>
      <details className="office-payment-guide"><summary><UiText text={"Where do I find these two details?"}/></summary><ol><li><UiText text={"Open your Paytm Payments merchant dashboard and choose Developer settings / API keys."}/></li><li><UiText text={"For a trial, choose Test mode and copy its Merchant ID and Merchant key here. Use the matching Test payments mode above."}/></li><li><UiText text={"Choose Live payments only after Paytm activates your merchant account. Copy the live MID and key, then approve the connection."}/></li></ol><p><UiText text={"Saving credentials connects this merchant’s checkout settings. A transaction is marked paid only after KaamSet verifies it with Paytm."}/></p></details>
      <small className="office-footnote">
        <UiText text={"Keys are encrypted on the server. Customer screens and teammates never receive them."}/></small>
    </section>
  );
}
export default function MerchantOffice() {
const {t:localize}=useLanguage();

  const {t}=useLanguage();
  const setupTokenPromise=useRef<Promise<string>|null>(null);
  async function getSetupToken(){
    const saved=sessionStorage.getItem('kaamset_setup_voice_token');if(saved)return saved;
    if(!setupTokenPromise.current)setupTokenPromise.current=api.onboardingSession().then(r=>{sessionStorage.setItem('kaamset_setup_voice_token',r.token);return r.token}).finally(()=>{setupTokenPromise.current=null});
    return setupTokenPromise.current;
  }
  const [token, setToken] = useState<string | null>(() =>
      localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey),
    ),
    [workspace, setWorkspace] = useState<WorkspaceState | null>(null),
    [page, setPage] = useState<Page>(restoredPage),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [task, setTask] = useState<{blueprintId:string;text:string;version?:number}|null>(null),
    [selected, setSelected] = useState(()=>sessionStorage.getItem("kaamset_selected_teammate")||""),
    [accountOpen, setAccountOpen] = useState(
      window.location.pathname === "/reset-password",
    ),
    [resetToken] = useState(() =>
      window.location.pathname === "/reset-password"
        ? new URLSearchParams(window.location.search).get("token")
        : null,
    ),
    [menu, setMenu] = useState(false),
    [brief, setBrief] = useState(""),
    [briefApproved, setBriefApproved] = useState(false),
    [sharing,setSharing]=useState<{name:string;url:string}|null>(null);
  const [choosingTeam,setChoosingTeam]=useState<ReadyTeamId|null>(null),[recipeCopied,setRecipeCopied]=useState(false);
  useEffect(()=>{if(selected)sessionStorage.setItem("kaamset_selected_teammate",selected);else sessionStorage.removeItem("kaamset_selected_teammate")},[selected]);
  const sharedLinkSeen=useRef(false);
  const legacyRestore = useRef(!localStorage.getItem(storageKey) && !!localStorage.getItem(legacyStorageKey));
  const workspaceRef=useRef(workspace);workspaceRef.current=workspace;
  const tokenRef = useRef(token),
    inFlight = useRef(false),
    menuButton = useRef<HTMLButtonElement>(null),
    sidebar = useRef<HTMLElement>(null),
    pageContent = useRef<HTMLElement>(null);
  function acceptToken(next: string) {
    localStorage.setItem(storageKey, next);
    legacyRestore.current = false;
    tokenRef.current = next;
    setToken(next);
    setWorkspace(null);
    setError("");
    setNotice("");
    setPage("work");
    setSelected("");
    setTask(null);
    setChoosingTeam(null);
    sessionStorage.removeItem(connectionAttemptKey);
    setMenu(false);
  }
  async function refresh(t = tokenRef.current) {
    if (!t) return;
    const w = await api.workspace(t);
    if (tokenRef.current !== t) return;
    setWorkspace(w);
    return w;
  }
  async function act(title: string, fn: () => Promise<unknown>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(title);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
      inFlight.current = false;
    }
  }
  useEffect(() => {
    if (!token) return;
    let cancelled = false,
      polling = false;
    const run = async () => {
      if (polling) return;
      polling = true;
      try {
        const w = await api.workspace(token);
        if (!cancelled) {
          if (!w.business) {
            if (localStorage.getItem(storageKey) === token) localStorage.removeItem(storageKey);
            legacyRestore.current = false;
            tokenRef.current = null;
            setToken(null);
            setWorkspace(null);
            setError("");
            return;
          }
          // Recover existing merchant offices without importing sample demo data.
          if (localStorage.getItem(legacyStorageKey) === token) {
            localStorage.setItem(storageKey, token);
            localStorage.removeItem(legacyStorageKey);
            legacyRestore.current = false;
          }
          setWorkspace(w);
        }
      } catch (e) {
        if (!cancelled) {
          if (legacyRestore.current) {
            legacyRestore.current = false;
            tokenRef.current = null;
            setToken(null);
            setWorkspace(null);
          } else setError((e as Error).message);
        }
      } finally {
        polling = false;
      }
    };
    void run();
    let timer:ReturnType<typeof setTimeout>;
    const tick=async()=>{if(document.visibilityState==='visible')await run();if(!cancelled){const currentWork=workspaceRef.current;const pending=currentWork?.tasks.some(t=>['queued','working'].includes(t.state))||currentWork?.sites?.some(s=>['queued','working'].includes(s.state))||!!currentWork?.businessGuideRun&&['queued','working'].includes(currentWork.businessGuideRun.state);timer=setTimeout(tick,pending?4500:18000)}};
    timer=setTimeout(tick,6000);
    const wake=()=>{if(document.visibilityState==='visible')void run()};document.addEventListener('visibilitychange',wake);window.addEventListener('focus',wake);
    return () => {
      cancelled = true;
      clearTimeout(timer);document.removeEventListener("visibilitychange",wake);window.removeEventListener("focus",wake);
    };
  }, [token]);
  useEffect(() => {
    if(!sharing)return;
    const modal=document.querySelector<HTMLElement>('.office-modal[role="dialog"]'),previous=document.activeElement as HTMLElement|null;
    const items=()=>Array.from(modal?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,input,a[href]')||[]);
    items()[0]?.focus();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSharing(null)}if(e.key==='Tab'){const list=items(),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
    document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;previous?.focus()};
  }, [!!sharing]);
  useEffect(() => { sessionStorage.setItem(pageKey, page); }, [page]);
  useEffect(()=>{if(!workspace||sharedLinkSeen.current)return;const code=selectedReadyTeam(new URLSearchParams(location.search).get("team"));if(code){sharedLinkSeen.current=true;setChoosingTeam(code)}},[!!workspace]);
  useEffect(() => {
    if (!menu) return;
    const first = sidebar.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenu(false); menuButton.current?.focus(); }
      if (event.key !== "Tab") return;
      const items = Array.from(sidebar.current?.querySelectorAll<HTMLElement>("a[href],button:not(:disabled)") || []);
      const firstItem = items[0], lastItem = items.at(-1);
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem?.focus(); }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem?.focus(); }
    };
    document.addEventListener("keydown", key);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = previousOverflow; };
  }, [menu]);
  useEffect(() => {
    if (!workspace || page !== "connections") return;
    const params = new URLSearchParams(location.search);
    const callback = params.get("connected");
    const attempt = callback || sessionStorage.getItem(connectionAttemptKey);
    if (!attempt || !["instagram", "gmail", "googlecalendar", "googlesheets"].includes(attempt)) return;
    sessionStorage.removeItem(connectionAttemptKey);
    if (callback) { params.delete("connected"); history.replaceState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`); }
    void act("Checking your returned connection", async () => {
      const result = await api.refreshConnection(token!, attempt);
      await refresh();
      setNotice((result as {status?: string}).status === "connected"
        ? "Account connected. Review its permissions in the relevant desk before enabling actions."
        : "Account authorization is not finished. Choose Continue connection to start a fresh authorization, or check again after completing it.");
    });
  }, [!!workspace, page]);
  useEffect(() => {
    if (workspace) {
      setBrief(workspace.brief);
      setBriefApproved(workspace.briefApproved);
    }
  }, [workspace?.brief, workspace?.briefApproved]);
  useEffect(() => {
    document.title = "KaamSet — Your business. Your AI team.";
    const verification = new URLSearchParams(window.location.search).get(
      "verify",
    );
    if (resetToken) history.replaceState({}, "", "/");
    if (!verification) return;
    history.replaceState({}, "", window.location.pathname);
    void act("Verifying your business account", async () => {
      const r = await api.account("verify", { token: verification });
      if (r.token) {
        acceptToken(r.token);
        setNotice("Email verified. Your business workspace is saved.");
        await refresh(r.token);
      }
    });
  }, []);
  async function finishSetup(setup: BusinessSetup) {
    await act("Setting up your office", async () => {
      const r = await api.onboard(setup,sessionStorage.getItem('kaamset_setup_voice_token')||undefined);
      sessionStorage.removeItem('kaamset_setup_voice_token');
      acceptToken(r.token);
      setWorkspace(r.workspace);
      sessionStorage.removeItem("kaamset_setup_draft");
      const id=selectedReadyTeam(setup.goal.replace("Ready team: ","")) || "sia";
      setBusy("Preparing your ready teammate");
      const b=await api.readyTeam(r.token,id);
      setSelected(b.id);
      await refresh(r.token);
      navigate("business");
      setNotice("Your description is saved. Get Sia’s simple setup guide, try a sample record, or review your chosen teammate.");
      if (r.workspace.providers?.cognee)
        void api
          .remember(r.token)
          .then(() => refresh(r.token))
          .catch(() =>
            setNotice(
              "Your team is ready. Save the approved facts to shared memory from Business & memory.",
            ),
          );
    });
  }
  async function configureReadyTeam(id:ReadyTeamId,options:Record<string,boolean>,revision?:number){
    await act("Saving teammate setup",async()=>{if(!token)return;const b=await api.readyTeam(token,id,options,revision);setSelected(b.id);await refresh();setChoosingTeam(null);navigate("team");setNotice("Review the saved job, then activate your teammate. Live actions wait for their required connections.");});
  }
  const deskFor:Partial<Record<ReadyTeamId,Page>>={arjun:'counter',dukaan:'shop',naina:'khata',nazar:'money',kabir:'requests',ira:'requests',sahaj:'assistant',rang:'marketing',udaan:'website',raabta:'customers',saathi:'whatsapp'};
  function openReadyTeam(id:ReadyTeamId){const b=workspace?.blueprints.find(b=>b.presetId===id);if(b?.state==='active'){setSelected(b.id);sessionStorage.setItem("kaamset_selected_teammate",b.id);navigate(deskFor[id]||'team')}else setChoosingTeam(id)}
  function askReadyTeam(id:ReadyTeamId){const b=workspace?.blueprints.find(b=>b.presetId===id);if(b?.state==='active'){setSelected(b.id);setTask({blueprintId:b.id,text:readyTeams.find(t=>t.code===id)!.example});navigate('team')}else setChoosingTeam(id)}
  const current =
    workspace?.blueprints.find((b) => b.id === selected) ||
    workspace?.blueprints.at(-1);
  async function control(
    b: Teammate,
    action: "activate" | "pause" | "accept_scope",
  ) {
    await act("Updating your team", async () => {
      if (!token) return;
      await api.teammateControl(token, b, action);
      await refresh();
    });
  }
  function navigate(next: Page) {
    setPage(next);
    setMenu(false);
    requestAnimationFrame(() => { pageContent.current?.focus({preventScroll: true}); window.scrollTo({top: 0, behavior: "instant"}); });
  }
  async function connectApp(id: string, title: string, restart = false) {
    const limit=Number(sessionStorage.getItem(`kaamset_connection_wait_${id}`)||'0');
    if(Date.now()<limit){showSia('instagram_limit','Instagram has limited sign-in attempts. Wait before trying again. You can continue setting up the rest of your business.');return;}
    await act(`Opening ${title} connection`, async () => {
      if (restart) await api.disconnect(token!, id);
      const r = await api.connect(token!, id);
      sessionStorage.setItem(pageKey, "connections");
      sessionStorage.setItem(connectionAttemptKey, id);
      await refresh();
      window.location.assign(r.url);
    });
  }
  const pending =
      (workspace?.tasks.filter((t) => ["queued", "working"].includes(t.state)).length || 0) +
      (workspace?.sites?.filter((s) => ["queued", "working"].includes(s.state)).length || 0) +
      (workspace?.businessGuideRun && ["queued", "working"].includes(workspace.businessGuideRun.state) ? 1 : 0),
    inactiveTeams = workspace?.blueprints.filter((b) => b.state !== "active").length || 0;
  const recentWork = [
    ...(workspace?.tasks || []).map((value) => ({kind: "task" as const, value, time: value.createdAt})),
    ...(workspace?.sites || []).map((value) => ({kind: "site" as const, value,
      time: value.publishedAt || value.studioCheckpoint?.stages.at(-1)?.completedAt || value.approvedAt || ""})),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  const onboarding = !token || (workspace && !workspace.business);
  return (
    <div className="office-root">
      {onboarding ? (
        <>
          <Setup
            busy={busy}
            onFinish={finishSetup}
            onSignIn={() => setAccountOpen(true)}
            getSetupToken={getSetupToken}
          />
          {error && (
            <div className="office-setup-error" role="alert">
              {error}
            </div>
          )}
        </>
      ) : !workspace ? (
        <main className="office-loading">
          <Brand />
          {!error && <LoaderCircle className="spin" />}
          <h2><UiText text={"Opening your cloud office"}/></h2>
          {error && (
            <>
              <p className="office-error">{error}</p>
              <button className="office-primary" disabled={!!busy} onClick={()=>void act("Reopening your workspace",async()=>{await refresh()})}><UiText text={"Try again "}/><RefreshCw size={16}/></button>
              <button
                className="office-secondary"
                onClick={() => setAccountOpen(true)}
              >
                <UiText text={"Sign in to a saved workspace"}/></button>
              <button
                className="office-text"
                onClick={() => {
                  localStorage.removeItem(storageKey);
                  tokenRef.current = null;
                  setToken(null);
                }}
              >
                <UiText text={"Start a new workspace"}/></button>
            </>
          )}
        </main>
      ) : (
        <div className="office-shell">
          {menu && (
            <button
              className="office-nav-backdrop"
              aria-label={localize("Close navigation")}
              onClick={() => setMenu(false)}
            />
          )}
          <aside ref={sidebar} id="office-navigation" className={`office-sidebar ${menu ? "mobile-open" : ""}`}>
            <Brand />
            <button
              className="office-business-switch"
              onClick={() => navigate("business")}
            >
              <span>{workspace.business?.name.slice(0, 1)}</span>
              <div>
                <strong>{workspace.business?.name}</strong>
                <small>{workspace.business?.category}</small>
              </div>
              <Settings size={15} />
            </button>
            <nav aria-label={localize("Business workspace")}>
              {(['daily','channels','settings'] as const).map(group=><div className="office-nav-group" key={group}><span className="office-nav-heading"><UiText text={group==='daily'?'Your dukaan':group==='channels'?'Customer channels':'Your setup'}/></span>{pages.filter(p=>group==='daily'?['work','team','counter','shop','khata','money','requests','assistant'].includes(p.id):group==='channels'?['customers','whatsapp','marketing','website','orders'].includes(p.id):['connections','business'].includes(p.id)).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={page === id ? "selected" : ""}
                  aria-current={page === id ? "page" : undefined}
                  onClick={() => navigate(id)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{t(label)}</span>
                  {id === "work" && pending > 0 && <><b className="nav-badge-running" aria-hidden="true">{pending}</b><span className="office-sr-only">, {pending} <UiText text={"running"}/></span></>}
                  {id === "team" && inactiveTeams > 0 && <><b className="nav-badge-attention" aria-hidden="true">{inactiveTeams}</b><span className="office-sr-only">, {inactiveTeams} <UiText text={"not active"}/></span></>}
                </button>
              ))}</div>)}
            </nav>
            <div className="office-sidebar-bottom">
              <div className={`office-cloud-state ${pending > 0 ? "is-working" : ""}`}>
                <Cloud size={18} aria-hidden="true" />
                <div>
                  <strong>
                    {workspace.controls?.paused
                      ? "Office paused"
                      : workspace.controls?.humanTakeover
                        ? "You’ve taken over"
                        : pending > 0
                          ? `${pending} job${pending > 1 ? "s" : ""} running`
                          : "Cloud office ready"}
                  </strong>
                  <small><UiText text={"Approved jobs keep running after you close this page"}/></small>
                </div>
              </div>
              <button
                className="office-text"
                onClick={() => setAccountOpen(true)}
              >
                <UiText text={workspace.account?.saved
                  ? "Sign in on another account"
                  : "Save my business account"}/>
                <ArrowUpRight size={14} />
              </button>
              <small>
                {workspace.limits.modelsRemaining} <UiText text={"AI calls available"}/><UiText text={workspace.limits.period === "daily" ? " today" : ""}/>
              </small>
            </div>
          </aside>
          <div className="office-body">
            <header className="office-topbar">
              <button
                className="office-mobile-menu"
                ref={menuButton}
                aria-label={menu ? "Close navigation" : "Open navigation"}
                aria-expanded={menu}
                aria-controls="office-navigation"
                onClick={() => setMenu(!menu)}
              >
                <Menu size={22} />
              </button>
              <span className="office-topbar-title">{t(pages.find((p) => p.id === page)?.label||'')}</span>
              <div>
                <span className={`office-live-dot ${workspace.account?.saved ? "" : "is-guest"}`} aria-hidden="true" />
                <span className="office-topbar-account">
                  <UiText text={workspace.account?.saved
                    ? "Saved workspace"
                    : "Guest workspace, not saved yet"}/>
                </span>
                <button
                  className="office-icon-button"
                  aria-label={localize("Refresh workspace")}
                  disabled={!!busy}
                  onClick={() => act("Refreshing your office", () => refresh())}
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  className="office-secondary"
                  disabled={!!busy}
                  onClick={() =>
                    act("Updating owner control", async () => {
                      await api.control(
                        token!,
                        workspace.controls?.humanTakeover
                          ? "release"
                          : "takeover",
                      );
                      await refresh();
                    })
                  }
                >
                  {workspace.controls?.humanTakeover ? (
                    <>
                      <Play size={14} aria-hidden="true" /> <UiText text={"Resume team"}/></>
                  ) : (
                    <>
                      <Pause size={14} aria-hidden="true" /> <UiText text={"Take over"}/></>
                  )}
                </button>
              </div>
            </header>
            <main ref={pageContent} tabIndex={-1} className="office-content office-view-enter" key={page} aria-label={pages.find((p) => p.id === page)?.label}>
              {error && (
                <div className="office-error" role="alert">
                  {error}
                  <button
                    aria-label={localize("Dismiss error")}
                    onClick={() => setError("")}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {notice && (
                <div className="office-notice" role="status">
                  {notice}
                  <button
                    aria-label={localize("Dismiss notice")}
                    onClick={() => setNotice("")}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {busy && (
                <div className="office-busy" role="status">
                  <LoaderCircle className="spin" size={16} />
                  {busy}
                </div>
              )}
              {workspace.controls?.humanTakeover && (
                <div className="office-notice office-takeover-notice">
                  <UiText text={"You’ve taken over. Automatic replies and publishing are stopped until you choose Resume team at the top."}/></div>
              )}
              <Suspense fallback={<DeskLoading label={localize("Opening your teammate’s desk")}/>}>
              {['counter','shop','khata','money','requests'].includes(page)&&<MerchantOps key={page} page={page as OpsPage} token={token!} workspace={workspace} onChange={()=>refresh()} onChoose={setChoosingTeam} onCatalogue={()=>navigate('business')} onPayments={()=>navigate('connections')} onAsk={askReadyTeam}/>}
              {page === "work" && (
                <>
                  <WorkOverview
                    workspace={workspace}
                    busy={!!busy}
                    onNavigate={navigate}
                    onOpenTeam={(id) => { setSelected(id); setTask(null); navigate("team"); }}
                    onShowTeams={() => { const heading = document.getElementById("ready-teams-title"); heading?.scrollIntoView({ behavior: "smooth", block: "start" }); heading?.focus({ preventScroll: true }); }}
                  />
                  <ReadyTeamGallery workspace={workspace} busy={!!busy} onChoose={openReadyTeam}/>
                  <div className="office-section-heading">
                    <h2><UiText text={"Recent work"}/></h2>
                    <button
                      type="button"
                      className="office-text"
                      onClick={() => navigate("team")}
                    >
                      <UiText text={"Open my AI team "}/><ChevronRight size={16} />
                    </button>
                  </div>
                  {!recentWork.length ? (
                    <section className="office-empty">
                      <Cloud size={28} aria-hidden="true" />
                      <div>
                        <h3><UiText text={"No results yet."}/></h3>
                        <p>
                          <UiText text={"Open a ready team, approve its job and give it a short task. Finished results are saved here for you to read and copy."}/></p>
                      </div>
                    </section>
                  ) : (
                    <div className="office-work-list">
                      {recentWork.map((entry) => {
                        if (entry.kind === "site") {
                          const s = entry.value;
                          return (
                            <article className="office-card" key={`site-${s.id}`}>
                              <div className="office-card-head">
                                <Status value={s.state} />
                                {entry.time && <small>{new Date(entry.time).toLocaleString("en-IN")}</small>}
                              </div>
                              <h3>{s.businessName} <UiText text={"· Business website"}/></h3>
                              {!!s.studioCheckpoint?.stages.length && (
                                <div className="office-stage-trail">
                                  {s.studioCheckpoint.stages.map((stage) => (
                                    <span key={stage.stage}><Check size={13} />{websiteStageName(stage.stage, stage.specialistName)}</span>
                                  ))}
                                </div>
                              )}
                              <p>{s.state === "published"
                                ? "Your website team published a usable link from your approved business facts."
                                : s.reason || (["queued", "working"].includes(s.state)
                                  ? "Your website team is working in the cloud. Return here for the published link."
                                  : "Open your website team to review this job.")}</p>
                              {s.state === "published" && s.url && (
                                <a className="office-secondary" href={s.url} target="_blank" rel="noreferrer">
                                  <UiText text={"Open live website "}/><ArrowUpRight size={15} />
                                </a>
                              )}
                              <button className="office-text" onClick={() => navigate("website")}><UiText text={"Open website team "}/><ChevronRight size={15} /></button>
                            </article>
                          );
                        }
                        const t = entry.value;
                        return (
                          <article className="office-card" key={t.id}>
                            <div className="office-card-head">
                              <Status value={t.state} />
                              <small>
                                {new Date(t.createdAt).toLocaleString("en-IN")}
                              </small>
                            </div>
                            <h3>{t.result?.title || t.text}</h3>
                            {t.checkpoint?.stages.length ? (
                              <div className="office-stage-trail">
                                {t.checkpoint.stages.map((s) => (
                                  <span key={s.role}>
                                    <Check size={13} />
                                    {s.role === "specialist"
                                      ? `${s.specialistName ? `${s.specialistName} · ` : ""}Prepared`
                                      : `${s.specialistName ? `${s.specialistName} · ` : ""}Reviewed`}
                                  </span>
                                ))}
                                {t.state === "working" && (
                                  <span>
                                    <LoaderCircle className="spin" size={13} />{" "}
                                    <UiText text={"Working"}/></span>
                                )}
                              </div>
                            ) : null}
                            {t.state === "failed" &&
                              workspace.blueprints.some(
                                (b) =>
                                  b.id === t.blueprintId &&
                                  b.state === "active",
                              ) && (
                                <button
                                  className="office-secondary"
                                  disabled={!!busy}
                                  onClick={() =>
                                    act(
                                      "Retrying with current business facts",
                                      async () => {
                                        await api.runTeammate(
                                          token!,
                                          t.blueprintId,
                                          t.text,
                                        );
                                        await refresh();
                                      },
                                    )
                                  }
                                >
                                  <RefreshCw size={15} />
                                  <UiText text={"Try again with current facts"}/></button>
                              )}
                            {t.result ? (
                              <>
                                <p className="office-work-preview">{t.result.output.replace(/[#*]/g, "").slice(0,200)}<UiText text={t.result.output.length>200?"…":""}/></p>
                                <details className="office-work-artifact"><summary><UiText text={"Read full result"}/></summary>
                                <ResultText text={t.result.output} />{t.result.copyItems?.length?<CopyItems items={t.result.copyItems} onError={setError}/>:null}
                                <button
                                  className="office-text"
                                  onClick={() =>
                                    act("Copying result", async () => {
                                      await navigator.clipboard.writeText(
                                        t.result!.output,
                                      );
                                      setNotice(
                                        "Result copied. Review it before publishing or sending.",
                                      );
                                    })
                                  }
                                >
                                  <Copy size={15} />
                                  <UiText text={"Copy result"}/></button>
                                <div className="office-next">
                                  <strong><UiText text={"Next step"}/></strong>
                                  <p>{t.result.nextStep}</p>
                                </div>
                                </details>
                                {t.result.sources.length > 0 && (
                                  <details>
                                    <summary><UiText text={"View business sources"}/></summary>
                                    {t.result.sources.map((s, i) => (
                                      <p key={i}>{s}</p>
                                    ))}
                                  </details>
                                )}
                              </>
                            ) : (
                              <p>
                                {t.reason ||
                                  (["queued", "working"].includes(t.state)
                                    ? "Your team is working in the cloud. Closing this browser does not cancel the job."
                                    : "Your team needs a review before continuing.")}
                              </p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {page === "team" && (
                <>
                  <div className="office-heading">
                    <div>
                      <h1><UiText text={"Your AI team"}/></h1>
                      <p>
                        <UiText text={"Every team uses the same approved business facts and works only within its own job and permissions."}/></p>
                    </div>
                    <button
                      type="button"
                      className="office-secondary"
                      onClick={() => navigate("work")}
                    >
                      <Plus size={16} aria-hidden="true" /> <UiText text={"Add a ready team"}/></button>
                  </div>
                  {!current ? (
                    <section className="office-empty">
                      <Users size={30} aria-hidden="true" />
                      <div>
                        <h3><UiText text={"No team yet."}/></h3>
                        <p><UiText text={"Pick one of the 12 ready teams on My work. It starts by preparing drafts for your review."}/></p>
                        <button
                          type="button"
                          className="office-primary"
                          onClick={() => navigate("work")}
                        >
                          <UiText text={"See ready teams"}/></button>
                      </div>
                    </section>
                  ) : (
                    <div className="office-team-layout">
                      <aside className="office-team-list">
                        {workspace.blueprints.map((b) => (
                          <button
                            className={current.id === b.id ? "selected" : ""}
                            key={b.id}
                            onClick={() => setSelected(b.id)}
                          >
                            <PixelTeammate id={b.character} name={b.teamIdentity?.lead||b.plan.name} />
                            <div>
                              <strong>{teamName(b)}</strong>
                              <small>{label(b.state)}</small>
                            </div>
                            <ChevronRight size={15} />
                          </button>
                        ))}
                      </aside>
                      <section className="office-card office-team-detail" key={current.id}>
                        <div className="office-card-head">
                          <span className="office-eyebrow"><UiText text={"Team brief"}/></span>
                          <Status value={current.state} />
                        </div>
                        <h2>{teamName(current)}</h2>
                        {teamName(current) !== current.plan.name && <p className="office-team-job">{current.plan.name}</p>}
                        <p className="office-team-outcome">
                          {readyTeams.find(t=>t.code===current.presetId)?.tag||current.plan.outcome}
                        </p>
                        <TeamIdentity team={current} workspace={workspace}/>
                        {current.state==='active'&&<TeammateTask key={current.id} token={token!} team={current} workspace={workspace} initialRequest={task?.blueprintId===current.id?task.text:undefined} requestToEdit={task?.blueprintId===current.id&&task.version?{text:task.text,version:task.version}:undefined} onChange={()=>refresh()} onError={setError} onDesk={selectedReadyTeam(current.presetId)&&deskFor[current.presetId as ReadyTeamId]?()=>navigate(deskFor[current.presetId as ReadyTeamId]!):undefined}/>}
                        <details className="teammate-job-details" open={current.state!=='active'}><summary><UiText text={"Team, rules & approved job"}/></summary><p>{current.plan.outcome}</p>
                        <div className="office-team-members">
                          {(current.team || []).map((m) => (
                            <article key={m.id}>
                              <PixelTeammate id={memberCharacter(m)} name={m.name} />
                              <div>
                                <strong>{m.name}</strong>
                                <span>{m.role}</span>
                                <small>{m.responsibility}</small>
                                {m.execution === "verified_code" && <small className="office-specialist-type"><UiText text={"Verified code checks"}/></small>}
                              </div>
                            </article>
                          ))}
                        </div>
                        <h3><UiText text={"How your team will work"}/></h3>
                        <ul>
                          {current.plan.rules.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        </details>
                        {current.feasibility.blockers.length > 0 && (
                          <div className="office-setup-needed">
                            <h3><UiText text={"Before your team can go live"}/></h3>
                            <ul>
                              {current.feasibility.blockers.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                            <div>
                              <button
                                className="office-secondary"
                                onClick={() => navigate("connections")}
                              >
                                <UiText text={"Connect apps"}/></button>
                              <button
                                className="office-text"
                                onClick={() => navigate("business")}
                              >
                                <UiText text={current.plan.skills.some(s=>["bill_review","shop_publish"].includes(s))?"Add products & prices":"Update business facts"}/>
                              </button>
                            </div>
                          </div>
                        )}
                        {current.plan.alternative&&<div className="office-setup-needed"><h3><UiText text={"Choose a supported ready teammate"}/></h3><p><UiText text={"This older job needs a supported scope. Choose a ready teammate and review its settings."}/></p><button className="office-secondary" onClick={()=>navigate("work")}><UiText text={"Browse ready teammates"}/></button></div>}
                        <div className="office-actions">
                          <button
                            className="office-primary"
                            disabled={
                              !!busy ||
                              (current.state !== "active" &&
                                current.feasibility.state !== "ready_to_test")
                            }
                            onClick={() =>
                              control(
                                current,
                                current.state === "active"
                                  ? "pause"
                                  : "activate",
                              )
                            }
                          >
                            {current.state === "active" ? (
                              <>
                                <Pause size={15} /> <UiText text={"Pause team"}/></>
                            ) : (
                              <>
                                <Play size={15} /> <UiText text={"Activate team"}/></>
                            )}
                          </button>
                          <button
                            className="office-secondary"
                            disabled={!!busy}
                            onClick={() =>
                              act("Checking your team setup", async () => {
                                await api.recheckTeammate(token!, current);
                                await refresh();
                              })
                            }
                          >
                            <RefreshCw size={15} /> <UiText text={"Recheck setup"}/></button>
                          {selectedReadyTeam(current.presetId)&&deskFor[current.presetId as ReadyTeamId]&&current.state==='active'&&<button className="office-secondary" onClick={()=>navigate(deskFor[current.presetId as ReadyTeamId]!)}><UiText text={"Open teammate’s desk "}/><ArrowRight size={15}/></button>}
                          {selectedReadyTeam(current.presetId)&&<><button className="office-secondary" disabled={!!busy} onClick={()=>setChoosingTeam(current.presetId as ReadyTeamId)}><UiText text={"Configure teammate"}/></button><button className="office-text" disabled={!!busy} onClick={()=>{const url=new URL("/",location.origin);url.searchParams.set("team",current.presetId!);setRecipeCopied(false);setSharing({name:teamName(current),url:url.toString()})}}><Copy size={15}/> <UiText text={"Share teammate"}/></button></>}
                        </div>
                        <section className="office-team-results" aria-label={localize("This teammate’s work")}>
                          <div className="office-card-head"><h3><UiText text={"This teammate’s work"}/></h3><button className="office-text" onClick={()=>navigate('work')}><UiText text={"All workspace results "}/><ArrowRight size={15}/></button></div>
                          {workspace.tasks.filter(t=>t.blueprintId===current.id).slice(-3).reverse().map((t,index)=><article className="office-team-result" key={t.id}>
                            <div className="office-card-head"><Status value={t.state}/><small>{new Date(t.createdAt).toLocaleString('en-IN')}</small></div>
                            <h4>{t.result?.title||t.text}</h4>{['failed','waiting_owner'].includes(t.state)&&<button className="office-secondary" disabled={!!busy} onClick={()=>setTask({blueprintId:current.id,text:t.text,version:Date.now()})}><UiText text={"Edit this task "}/><RefreshCw size={14}/></button>}
                            {!!t.checkpoint?.stages.length&&<div className="office-stage-trail">{t.checkpoint.stages.map(s=><span key={s.role}><Check size={13}/>{s.specialistName} · <UiText text={s.role==='specialist'?'Prepared':'Reviewed'}/></span>)}</div>}
                            {t.result?<><details open={index===0}><summary><UiText text={"Read the result"}/></summary><ResultText text={t.result.output}/>{!!t.result.copyItems?.length&&<CopyItems items={t.result.copyItems} onError={setError}/>}<button className="office-text" onClick={()=>void act("Copying result",async()=>{await navigator.clipboard.writeText(t.result!.output);setNotice("Result copied. Review before sending or publishing.")})}><Copy size={14}/> <UiText text={"Copy result"}/></button><div className="office-next"><strong><UiText text={"Next step"}/></strong><p>{t.result.nextStep}</p></div></details><details><summary><UiText text={"Business sources"}/></summary>{t.result.sources.map((s,i)=><p key={i}>{s}</p>)}</details></>:<p>{t.reason||(['queued','working'].includes(t.state)?'Your cloud team is working. You can close this browser and return to the result.':'Open the approved job and recheck its setup to continue.')}</p>}
                          </article>)}
                          {!workspace.tasks.some(t=>t.blueprintId===current.id)&&<p className="office-footnote"><UiText text={"Saved results and progress will appear here after your first task."}/></p>}
                        </section>
                      </section>
                    </div>
                  )}
                </>
              )}
              {page === "customers" && (
                <InboxPanel
                  token={token}
                  workspace={workspace}
                  onChange={() => refresh()}
                  onConnect={() => navigate("connections")}
                  onWhatsApp={() => navigate("whatsapp")}
                />
              )}
              {page === "whatsapp" && (
                <WhatsAppSalesDesk
                  token={token}
                  workspace={workspace}
                  onChange={() => refresh()}
                  onBuild={() => setChoosingTeam("saathi")}
                  onBusiness={() => navigate("business")}
                  onTeam={(id) => { setSelected(id); navigate("team"); }}
                  paymentSettings={<PaymentSettings token={token!} workspace={workspace} onChange={() => refresh()} onSaveAccount={() => setAccountOpen(true)} />}
                />
              )}
              {page === "marketing" && (
                <ContentStudio
                  token={token}
                  teammates={workspace.blueprints}
                  posts={workspace.posts || []}
                  instagramReady={workspace.connections.some(c=>c.toolkit==='instagram'&&c.status==='connected'&&!!c.identity)}
                  onConnect={() => navigate("connections")}
                  onChange={() => refresh()}
                  onBuild={() => setChoosingTeam("rang")}
                />
              )}
              {page === "website" && (
                <WebsiteStudio
                  token={token}
                  workspace={workspace}
                  onChange={() => refresh()}
                  onBuild={() => setChoosingTeam("udaan")}
                />
              )}
              {page === "assistant" && (
                <MilanScheduler
                  token={token}
                  workspace={workspace}
                  onChange={() => refresh()}
                  onPair={() => navigate("whatsapp")}
                  onBuild={() => setChoosingTeam("sahaj")}
                />
              )}
              {page === "orders" && (
                <>
                  <OrderDesk
                    token={token}
                    workspace={workspace}
                    onChange={() => refresh()}
                  />
                  <UpiSettings token={token!} saved={!!workspace.account?.saved} onSaveAccount={()=>setAccountOpen(true)} onChange={()=>refresh()}/>
                  <PaymentSettings
                    token={token!}
                    workspace={workspace}
                    onChange={() => refresh()}
                    onSaveAccount={() => setAccountOpen(true)}
                  />
                  {!!workspace.payments?.length && (
                    <section className="office-card">
                      <h3><UiText text={"Payment evidence"}/></h3>
                      {workspace.payments.map((p) => (
                        <div className="office-payment-row" key={p.id}>
                          <div>
                            <strong>
                              ₹{(p.amountPaise / 100).toLocaleString("en-IN")}
                            </strong>
                            <small>
                              <UiText text={p.mode === "staging"
                                ? "Test payment"
                                : "Live payment"}/>{" "}
                              · {p.txnId || "No verified transaction yet"}
                            </small>
                          </div>
                          <Status value={p.state} />
                          {p.url && p.state !== "paid" && (
                            <a href={p.url} target="_blank" rel="noreferrer">
                              <UiText text={"Open checkout "}/><ArrowUpRight size={14} />
                            </a>
                          )}
                          <button
                            className="office-secondary"
                            disabled={!!busy || p.state === "paid"}
                            onClick={() =>
                              act("Verifying payment with Paytm", async () => {
                                await api.verifyPayment(token!, p.id);
                                await refresh();
                              })
                            }
                          >
                            <UiText text={"Verify status"}/></button>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
              {page === "connections" && (
                <>
                  <div className="office-heading">
                    <div>
                      <h1><UiText text={"Connections"}/></h1>
                      <p>
                        <UiText text={"Connect only the accounts a team needs. A connected account does nothing until you turn on its actions in that team’s desk."}/></p>
                    </div>
                  </div>
                  <div className="office-connection-grid">
                    {[
                      {
                        id: "instagram",
                        title: "Instagram",
                        Icon: Instagram,
                        description:
                          "Professional account · publishing, comments and eligible DMs.",
                      },
                      {
                        id: "gmail",
                        title: "Gmail",
                        Icon: Mail,
                        description:
                          "Your sales inbox · enquiries and approved replies.",
                      },
                      {
                        id: "googlecalendar",
                        title: "Google Calendar",
                        Icon: Activity,
                        description:
                          "Appointments · availability and confirmed booking evidence.",
                      },
                      {
                        id: "googlesheets",
                        title: "Google Sheets",
                        Icon: FileText,
                        description:
                          "Business records · scoped file permissions.",
                      },
                    ].map(({ id, title, Icon, description }) => {
                      const connected = workspace.connections.find(
                        (c) => c.toolkit === id,
                      );
                      return (
                        <article key={id} className="office-card">
                          <span className={`office-app-icon app-${id}`}>
                            <Icon size={24} />
                          </span>
                          <h3>{title}</h3>
                          <p>{description}</p>
                          <Status
                            value={connected?.status || "not_connected"}
                          />
                          <div className="office-actions">
                            {connected?.status !== "connected" ? (
                              <button
                                className="office-secondary"
                                disabled={!!busy}
                                onClick={() =>
                                  connectApp(id, title, connected?.status==='needs_attention')
                                }
                              >
                                <UiText text={connected ? "Continue connection" : "Connect"}/> <ArrowUpRight size={14} />
                              </button>
                            ) : (
                              <>
                                {(id === "instagram" || id === "gmail") && <button className="office-secondary" onClick={() => navigate("customers")}><UiText text={"Start "}/><UiText text={id === "instagram" ? "Riya" : "Meera"}/> <UiText text={"replies "}/><ChevronRight size={14}/></button>}
                                <button
                                  className="office-text"
                                  disabled={!!busy}
                                  onClick={() =>
                                    act("Disconnecting app", async () => {
                                      await api.disconnect(token!, id);
                                      await refresh();
                                    })
                                  }
                                >
                                  <UiText text={"Disconnect"}/></button>
                              </>
                            )}
                            {connected && <button className="office-secondary" disabled={!!busy} onClick={() => act("Checking app connection", async () => {
                              const result = await api.refreshConnection(token!, id) as {status?: string};
                              await refresh();
                              setNotice(result.status === "connected" ? `${title} is connected. Enable approved actions in its desk.` : `${title} still needs authorization. Choose Continue connection to try again.`);
                            })}><UiText text={"Check connection"}/></button>}
                          </div>
                          {id==='instagram'&&connected?.status!=='connected'&&<details className="instagram-recovery"><summary>{t('Trouble connecting Instagram?')}</summary><p>{t('Instagram Business or Creator accounts are supported. A 429 comes from Instagram limiting sign-in attempts. Repeated retries can prolong the problem.')}</p><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">{t('Open Instagram to check your account')}</a><button type="button" className="office-text" onClick={()=>{sessionStorage.setItem('kaamset_connection_wait_instagram',String(Date.now()+15*60000));showSia('instagram_limit','Instagram has limited sign-in attempts. Wait before trying again. You can continue setting up the rest of your business.')}}>{t('Instagram showed “Too many requests”')}</button>{connected&&<button type="button" className="office-text" disabled={!!busy} onClick={()=>{if(window.confirm(t('Start a new Instagram connection? Use this only after the old link expires or Instagram allows sign-in again.')))void connectApp(id,title,true)}}>{t('Start fresh')}</button>}<small>{t('KaamSet pauses retries for 15 minutes when you report this error. Instagram may require longer. Check connection first if consent already finished.')}</small></details>}
                          {connected?.identity && (
                            <small>@{connected.identity.username}</small>
                          )}
                        </article>
                      );
                    })}
                    <article className="office-card">
                      <span className="office-app-icon app-whatsapp">
                        <MessageCircle size={24} />
                      </span>
                      <h3><UiText text={"WhatsApp"}/></h3>
                      <p>
                        <UiText text={"Pair your device with an isolated cloud session. Review reply rules before enabling your team."}/></p>
                      <button
                        className="office-secondary"
                        onClick={() => navigate("whatsapp")}
                      >
                        <UiText text={"Set up WhatsApp "}/><ChevronRight size={14} />
                      </button>
                    </article>
                    <article className="office-card">
                      <span className="office-app-icon">
                        <Brain size={24} />
                      </span>
                      <h3><UiText text={"Indian voice & shared memory"}/></h3>
                      <p>
                        <UiText text={"Speak your job with Sarvam. Save approved knowledge to Cognee so your teammates use the same facts."}/></p>
                      <span className="office-status">
                        <UiText text={"Voice"}/>{" "}
                        <UiText text={workspace.providers?.sarvam ? "ready" : "needs setup"}/>{" "}
                        <UiText text={"· Memory"}/>{" "}
                        <UiText text={workspace.providers?.cognee ? "ready" : "needs setup"}/>
                      </span>
                      <button
                        className="office-text"
                        onClick={() => navigate("business")}
                      >
                        <UiText text={"Open shared memory "}/><ChevronRight size={14} />
                      </button>
                    </article>
                  </div>
                  <UpiSettings token={token!} saved={!!workspace.account?.saved} onSaveAccount={()=>setAccountOpen(true)} onChange={()=>refresh()}/>
                  <PaymentSettings
                    token={token!}
                    workspace={workspace}
                    onChange={() => refresh()}
                    onSaveAccount={() => setAccountOpen(true)}
                  />
                </>
              )}
              {page === "business" && (
                <>
                  <section className="office-card interface-settings"><h2>{t('Language & help')}</h2><LanguagePicker/><p>{t('This changes the interface on this device. Your team follows the language saved in your approved business description.')}</p></section>
                  <SavedBusinessAssets token={token!} onChange={()=>refresh()}/>
                  <div className="office-heading">
                    <div>
                      <h1><UiText text={"Business & memory"}/></h1>
                      <p>
                        <UiText text={"What your teams know about your business, where it came from, and what they may use. Changing your facts pauses affected teams until you review them again."}/></p>
                    </div>
                  </div>
                  <Suspense fallback={<DeskLoading/>}><BusinessStart token={token!} workspace={workspace} onChange={()=>refresh()} onChoose={openReadyTeam} onOpenTask={id=>{setSelected(id);sessionStorage.setItem("kaamset_selected_teammate",id);setTask(null);navigate("team")}}/></Suspense>
                  <details className="business-optional-setup"><summary><UiText text={"Edit your business description"}/></summary>
                  <section className="office-card">
                    <p className="business-pause-note"><UiText text={"Saving changed facts pauses the teams that use them. Review each team afterwards and activate it again."}/></p>
                    <label>
                      <UiText text={"Business description your teams use"}/><textarea
                        rows={12}
                        maxLength={12000}
                        value={brief}
                        onChange={(e) => {
                          setBrief(e.target.value);
                          setBriefApproved(false);
                        }}
                      />
                    </label>
                    <label className="office-check">
                      <input
                        type="checkbox"
                        checked={briefApproved}
                        onChange={(e) => setBriefApproved(e.target.checked)}
                      />
                      <span>
                        <UiText text={"I’ve reviewed and approved these facts. No passwords, payment keys or private customer details are included."}/></span>
                    </label>
                    <button
                      className="office-primary"
                      disabled={
                        !!busy || !briefApproved || brief.trim().length < 40
                      }
                      onClick={() =>
                        act("Saving your approved playbook", async () => {
                          await api.saveBrief(token!, brief, true);
                          await refresh();
                          if (workspace.providers?.cognee) {
                            await api.remember(token!);
                            await refresh();
                          }
                        })
                      }
                    >
                      <UiText text={"Save approved facts "}/><Check size={16} />
                    </button>
                  </section>
                  </details>
                  <details className="business-optional-setup"><summary><UiText text={"Products, prices and stock for bills and quotes"}/></summary>
                  <Catalogue
                    token={token}
                    workspace={workspace}
                    ensureToken={async () => token!}
                    onChange={() => refresh()}
                  />
                  </details>
                  <section className="office-card"><BusinessMemory token={token} enabled={!!workspace.providers?.cognee} onChange={()=>refresh()}/></section>
                  <section className="office-card">
                    <h3><UiText text={"Workspace & account"}/></h3>
                    <p>
                      <UiText text={workspace.account?.saved
                        ? "Your verified account can recover this workspace on another device."
                        : "This guest workspace expires. Verify your email to save your business workspace."}/>
                    </p>
                    <p>
                      <UiText text={"Available AI requests: "}/>{workspace.limits.modelsRemaining}<UiText text={". App operations: "}/>{workspace.limits.toolsRemaining}.
                      {workspace.limits.resetAt &&
                        ` Usage resets ${new Date(workspace.limits.resetAt).toLocaleString("en-IN")}.`}
                    </p>
                    <button
                      className="office-secondary"
                      onClick={() => setAccountOpen(true)}
                    >
                      <UiText text={workspace.account?.saved
                        ? "Sign in to another workspace"
                        : "Save workspace"}/>
                    </button>
                    <button
                      className="office-text"
                      disabled={!!busy}
                      onClick={() =>
                        act("Signing out", async () => {
                          if (workspace.account?.saved)
                            await api.signOut(token!);
                          localStorage.removeItem(storageKey);
                          tokenRef.current = null;
                          setToken(null);
                          setWorkspace(null);
                          setNotice(
                            "This browser has signed out. Authorised cloud work continues.",
                          );
                        })
                      }
                    >
                      <UiText text={"Sign out of this browser"}/></button>
                  </section>
                </>
              )}
              </Suspense>
            </main>
            <footer className="office-footer">
              <span><UiText text={"kaamset · Made for the work of your business."}/></span>
              <span><UiText text={"Cloud work follows your facts and permissions."}/></span>
            </footer>
          </div>
        </div>
      )}
      {accountOpen && (
        <AccountDialog
          token={token}
          saved={!!workspace?.account?.saved}
          resetToken={resetToken}
          onClose={() => setAccountOpen(false)}
          onToken={acceptToken}
        />
      )}
      <SiaAssistant getToken={()=>token?Promise.resolve(token):getSetupToken()}/>
      {choosingTeam&&workspace&&<ReadyTeamSetup key={choosingTeam} code={choosingTeam} workspace={workspace} busy={!!busy} onClose={()=>setChoosingTeam(null)} onSave={configureReadyTeam}/>}
      {sharing&&<div className="office-modal-overlay"><section className="office-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="office-close" aria-label={localize("Close teammate sharing")} onClick={()=>setSharing(null)}><X size={20}/></button><h2 id="share-title"><UiText text={"Share "}/>{sharing.name}</h2><p><UiText text={"Your partner chooses this ready teammate using their own business facts, connections and approvals."}/></p><label><UiText text={"Teammate setup link"}/><input readOnly value={sharing.url} onFocus={e=>e.target.select()}/></label><p className="office-footnote"><UiText text={"This link contains only the teammate choice. Your business records and connected accounts remain in your workspace."}/></p><button className="office-primary" onClick={async()=>{try{await navigator.clipboard.writeText(sharing.url);setRecipeCopied(true)}catch{setError('Copy could not finish. Select and copy the setup link above.')}}}><Copy size={16}/><UiText text={recipeCopied?'Link copied':'Copy setup link'}/></button></section></div>}
    </div>
  );
}
