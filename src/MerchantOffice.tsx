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
import { BusinessMemory, ContentStudio } from "./OwnerTools";
import {
  Catalogue,
  MilanScheduler,
  OrderDesk,
  SharedBrain,
} from "./MerchantTools";
import {readyTeams,selectedReadyTeam,ReadyTeamGallery,ReadyTeamSetup,type ReadyTeamId} from "./ReadyTeams";
import MerchantOps,{type OpsPage} from "./MerchantOps";
import UpiSettings from "./UpiSettings";
const TeammateTask = lazy(() => import("./TeammateTask"));
import "./office.css";

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
function Brand() {
  return (
    <a className="office-brand" href="/" aria-label="KaamSet home">
      <span className="office-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      <strong>
        kaam<span>set</span>
      </strong>
    </a>
  );
}
function Status({ value }: { value: string }) {
  return (
    <span className={`office-status status-${value}`}>
      {["working", "queued"].includes(value) && <i />}
      {label(value)}
    </span>
  );
}
function Setup({
  busy,
  onFinish,
  onSignIn,
}: {
  busy: string;
  onFinish: (setup: BusinessSetup) => Promise<void>;
  onSignIn: () => void;
}) {
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
  const file = useRef<HTMLInputElement>(null);
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
    if (!valid || busy) return;
    if (step < 2) setStep(step + 1);
    else await onFinish(setup);
  }
  return (
    <div className="office-onboarding">
      <header>
        <Brand />
        <button className="office-text" onClick={onSignIn}>
          Already have a workspace? Sign in <ArrowUpRight size={15} />
        </button>
      </header>
      <main className="office-welcome">
        <aside className="office-story">
          <span className="office-eyebrow">YOUR BUSINESS, WITH AN AI TEAM</span>
          <h1>
            Apni team chuniye.
            <br />
            <em>Team sambhal legi.</em>
          </h1>
          <p>
            Ready AI teammates learn your business, prepare useful work,
            and handle the live apps you connect from your cloud office.
          </p>
          <div className="office-crew-scene">
            <div className="scene-orbit" />
            <div className="scene-member scene-riya">
              <PixelTeammate id="baba" />
              <span>
                Arjun <small>Counter</small>
              </span>
            </div>
            <div className="scene-member scene-milo">
              <PixelTeammate id="ma" />
              <span>
                Naina <small>Khata</small>
              </span>
            </div>
            <div className="scene-member scene-vijay">
              <PixelTeammate id="tara" />
              <span>
                Tara <small>Dukaan</small>
              </span>
            </div>
            <div className="scene-cloud">
              <Cloud size={21} /> Your cloud office
            </div>
          </div>
          <div className="office-promise">
            <ShieldCheck size={18} />
            <span>Your facts. Your accounts. Your approval.</span>
          </div>
        </aside>
        <section className="office-setup-card">
          <div className="setup-step">
            <span>LET’S SET UP YOUR OFFICE</span>
            <strong>{step + 1} / 3</strong>
          </div>
          <div className="setup-step-bars">
            {[0, 1, 2].map((n) => (
              <i key={n} className={n <= step ? "filled" : ""} />
            ))}
          </div>
          <form onSubmit={next}>
            {step === 0 ? (
              <>
                <h2>What’s your business?</h2>
                <p>A few details help your team sound like you.</p>
                <label>
                  Business name
                  <input
                    autoFocus
                    value={setup.name}
                    onChange={(e) => field("name", e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Asha Studio"
                    required
                  />
                </label>
                <label>
                  What kind of business?
                  <input
                    value={setup.category}
                    onChange={(e) => field("category", e.target.value)}
                    maxLength={80}
                    placeholder="Salon, kirana, coaching, clothing…"
                    required
                  />
                </label>
                <div className="office-form-row">
                  <label>
                    City or service area <small>Optional</small>
                    <input
                      value={setup.city}
                      onChange={(e) => field("city", e.target.value)}
                      maxLength={80}
                      placeholder="e.g. Pune"
                    />
                  </label>
                  <label>
                    Your preferred language
                    <select
                      value={setup.language}
                      onChange={(e) => field("language", e.target.value)}
                    >
                      {languageOptions.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            ) : step === 1 ? (
              <>
                <h2>What should your team know?</h2>
                <p>
                  Tell us what you offer and what customers usually ask. Add
                  prices only if you want the team to use them.
                </p>
                <label>
                  Products, services and useful facts
                  <textarea
                    autoFocus
                    value={setup.description}
                    rows={6}
                    maxLength={5000}
                    onChange={(e) => field("description", e.target.value)}
                    placeholder="We’re a salon in Baner. Haircuts start at ₹500. We’re open Tuesday to Sunday, 10am–7pm. Appointments need confirmation…"
                    required
                  />
                </label>
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
                  <Upload size={15} /> Use my business brief (.md / .txt)
                </button>
                <label>
                  Public contact <small>Optional</small>
                  <input
                    value={setup.contact}
                    onChange={(e) => field("contact", e.target.value)}
                    maxLength={150}
                    placeholder="Business phone or email"
                  />
                </label>
              </>
            ) : (
              <>
                <h2>Who should help you first?</h2>
                <p>Choose a ready teammate. No payment account is needed to start preparing work.</p>
                <div className="ready-onboarding-grid" role="group" aria-label="Choose your first teammate">
                  {readyTeams.filter(t=>!['saathi','rang','udaan','raabta'].includes(t.code)).map(t=><button className="ready-onboarding-option" type="button" key={t.code} aria-pressed={setup.goal===`Ready team: ${t.code}`} onClick={()=>field("goal",`Ready team: ${t.code}`)}><PixelTeammate id={t.id}/><span><strong>{t.name}</strong><small>{t.tag}</small></span>{setup.goal===`Ready team: ${t.code}`&&<Check size={16}/>}</button>)}
                </div>
                <label>
                  When should your team ask you?
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={setup.rules}
                    onChange={(e) => field("rules", e.target.value)}
                  />
                </label>
                <label className="office-check">
                  <input
                    type="checkbox"
                    checked={approved}
                    onChange={(e) => setApproved(e.target.checked)}
                  />
                  <span>
                    I’ve checked these business facts and approve them for my
                    team.
                  </span>
                </label>
              </>
            )}
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
                  Back
                </button>
              )}
              <button className="office-primary" disabled={!valid || !!busy}>
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={16} />
                    {busy}
                  </>
                ) : (
                  <>
                    {step === 2 ? "Open my teammate" : "Continue"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
            <p className="office-footnote">
              Start without an account. Verify your email to save your business
              workspace.
            </p>
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
            "button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]",
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
          aria-label="Close account dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="office-eyebrow">YOUR BUSINESS WORKSPACE</span>
        <h2 id="account-title">
          {mode === "register"
            ? "Save your office. Come back anytime."
            : mode === "recover"
              ? "Recover your account."
              : mode === "reset"
                ? "Choose a new password."
                : "Welcome back."}
        </h2>
        <p>
          {mode === "register"
            ? "Verify your email to recover your team, work and connections on another device."
            : "Sign in to your saved business workspace."}
        </p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Your name
              <input
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
              Email
              <input
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
              Password
              <input
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
            <small>Use at least 12 characters.</small>
          ) : (
            mode === "login" && (
              <label>
                Authenticator code <small>If enabled</small>
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
              Business
              <select
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="">Choose your business</option>
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
            {busy
              ? "Please wait…"
              : mode === "register"
                ? "Send verification email"
                : mode === "recover"
                  ? "Send recovery link"
                  : mode === "reset"
                    ? "Update password"
                    : "Sign in"}
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
            {mode === "login" ? "Forgot your password?" : "Back to sign in"}
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
            {mode === "register"
              ? "I already have an account"
              : "Save this workspace instead"}
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
          pay<span>tm</span>
        </span>
        <Status
          value={
            workspace.paymentSetup?.configured ? "configured" : "setup_needed"
          }
        />
      </div>
      <h3>{workspace.paymentSetup?.configured ? "Paytm Checkout settings are saved." : "Add Paytm Checkout for automatic verification."}</h3>
      <p>
        Send an accepted order’s payment request, let the customer pay, then
        verify the transaction with Paytm before marking it collected.
      </p>
      {workspace.paymentSetup && (
        <p className="office-notice">
          {workspace.paymentSetup.mode === "staging"
            ? "Test merchant"
            : "Live merchant"}{" "}
          · MID ending {workspace.paymentSetup.midSuffix}. Payment verification
          happens with Paytm.
        </p>
      )}
      {!workspace.account?.saved ? (
        <div><p className="office-footnote">Save your business with a verified email first, so only you can recover its payment connection.</p><button className="office-secondary" onClick={onSaveAccount}>
          Save your business account to connect Paytm <ChevronRight size={16} />
        </button></div>
      ) : (!workspace.paymentSetup?.configured || changing) ? (
        <form onSubmit={submit}>
          <div className="office-form-row">
            <label>
              Payment mode
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as "staging" | "production");
                  setApproved(false);
                }}
              >
                <option value="staging">Test payments</option>
                <option value="production">Live payments</option>
              </select>
            </label>
            <label>
              Merchant ID
              <input
                value={mid}
                required
                maxLength={40}
                autoComplete="off"
                placeholder="MID from your Paytm dashboard"
                onChange={(e) => { setMid(e.target.value); setApproved(false); }}
              />
            </label>
          </div>
          <label>
            Merchant key
            <input
              type="password"
              value={merchantKey}
              required
              minLength={16}
              maxLength={16}
              autoComplete="new-password"
              placeholder="16-character merchant key"
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
              {mode === "production"
                ? "I am authorised to use this live merchant account. Customer-accepted requests may collect real payments."
                : "I am authorised to use this test merchant account."}
            </span>
          </label>
          {error && <p className="office-error">{error}</p>}
          <button className="office-primary" disabled={busy || !approved}>
            {busy ? "Saving securely…" : "Save Paytm connection"}
            <ShieldCheck size={16} />
          </button>
        </form>
      ) : <button className="office-secondary" onClick={() => setChanging(true)}>Change Paytm connection <Settings size={14} /></button>}
      <a
        href="https://dashboard.paytmpayments.com/login/"
        target="_blank"
        rel="noreferrer"
        className="office-text"
      >
        Find your merchant credentials in Paytm <ArrowUpRight size={14} />
      </a>
      <details className="office-payment-guide"><summary>Where do I find these two details?</summary><ol><li>Open your Paytm Payments merchant dashboard and choose Developer settings / API keys.</li><li>For a trial, choose Test mode and copy its Merchant ID and Merchant key here. Use the matching Test payments mode above.</li><li>Choose Live payments only after Paytm activates your merchant account. Copy the live MID and key, then approve the connection.</li></ol><p>Saving credentials connects this merchant’s checkout settings. A transaction is marked paid only after KaamSet verifies it with Paytm.</p></details>
      <small className="office-footnote">
        Keys are encrypted on the server. Customer screens and teammates never
        receive them.
      </small>
    </section>
  );
}
export default function MerchantOffice() {
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
    const tick=async()=>{if(document.visibilityState==='visible')await run();if(!cancelled){const currentWork=workspaceRef.current;const pending=currentWork?.tasks.some(t=>['queued','working'].includes(t.state))||currentWork?.sites?.some(s=>['queued','designing','publishing'].includes(s.state));timer=setTimeout(tick,pending?4500:18000)}};
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
      const r = await api.onboard(setup);
      acceptToken(r.token);
      setWorkspace(r.workspace);
      sessionStorage.removeItem("kaamset_setup_draft");
      const id=selectedReadyTeam(setup.goal.replace("Ready team: ","")) || "sia";
      setBusy("Preparing your ready teammate");
      const b=await api.readyTeam(r.token,id);
      setSelected(b.id);
      await refresh(r.token);
      setPage("team");
      setNotice("Your teammate is ready for review. Activate it to prepare work; add live connections when you need them.");
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
      (workspace?.sites?.filter((s) => ["queued", "working"].includes(s.state)).length || 0),
    needsAttention =
      (workspace?.brain?.snapshot.awaitingOwner || 0) +
      (workspace?.blueprints.filter((b) => b.state === "proposed").length || 0),
    completed =
      (workspace?.tasks.filter((t) => t.state === "completed").length || 0) +
      (workspace?.sites?.filter((s) => s.state === "published").length || 0);
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
          <h2>Opening your cloud office</h2>
          {error && (
            <>
              <p className="office-error">{error}</p>
              <button className="office-primary" disabled={!!busy} onClick={()=>void act("Reopening your workspace",async()=>{await refresh()})}>Try again <RefreshCw size={16}/></button>
              <button
                className="office-secondary"
                onClick={() => setAccountOpen(true)}
              >
                Sign in to a saved workspace
              </button>
              <button
                className="office-text"
                onClick={() => {
                  localStorage.removeItem(storageKey);
                  tokenRef.current = null;
                  setToken(null);
                }}
              >
                Start a new workspace
              </button>
            </>
          )}
        </main>
      ) : (
        <div className="office-shell">
          {menu && (
            <button
              className="office-nav-backdrop"
              aria-label="Close navigation"
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
            <nav aria-label="Business workspace">
              {(['daily','channels','settings'] as const).map(group=><div className="office-nav-group" key={group}><span className="office-nav-heading">{group==='daily'?'YOUR DUKAAN':group==='channels'?'CUSTOMER CHANNELS':'YOUR SETUP'}</span>{pages.filter(p=>group==='daily'?['work','team','counter','shop','khata','money','requests','assistant'].includes(p.id):group==='channels'?['customers','whatsapp','marketing','website','orders'].includes(p.id):['connections','business'].includes(p.id)).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={page === id ? "selected" : ""}
                  aria-current={page === id ? "page" : undefined}
                  onClick={() => navigate(id)}
                >
                  <Icon size={18} />
                  {label}
                  {id === "work" && pending > 0 && <b>{pending}</b>}
                </button>
              ))}</div>)}
            </nav>
            <div className="office-sidebar-bottom">
              <div className="office-cloud-state">
                <Cloud size={18} />
                <div>
                  <strong>
                    {workspace.controls?.paused
                      ? "Office paused"
                      : "Cloud office ready"}
                  </strong>
                  <small>Scheduled work runs while you’re away</small>
                </div>
              </div>
              <button
                className="office-text"
                onClick={() => setAccountOpen(true)}
              >
                {workspace.account?.saved
                  ? "Sign in on another account"
                  : "Save my business account"}
                <ArrowUpRight size={14} />
              </button>
              <small>
                {workspace.limits.modelsRemaining} AI calls available
                {workspace.limits.period === "daily" ? " today" : ""}
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
              <span>{pages.find((p) => p.id === page)?.label}</span>
              <div>
                <span className="office-live-dot" />
                {workspace.account?.saved
                  ? "Saved business workspace"
                  : "Guest workspace · save to keep"}
                <button
                  className="office-icon-button"
                  aria-label="Refresh workspace"
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
                      <Play size={14} /> Resume team
                    </>
                  ) : (
                    <>
                      <Pause size={14} /> Take over
                    </>
                  )}
                </button>
              </div>
            </header>
            <main ref={pageContent} tabIndex={-1} className="office-content office-view-enter" key={page} aria-label={pages.find((p) => p.id === page)?.label}>
              {error && (
                <div className="office-error" role="alert">
                  {error}
                  <button
                    aria-label="Dismiss error"
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
                    aria-label="Dismiss notice"
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
                <div className="office-notice">
                  You’re in control. Automatic replies and publishing are
                  stopped until you resume the team.
                </div>
              )}
              <Suspense fallback={<DeskLoading label="Opening your teammate’s desk"/>}>
              {['counter','shop','khata','money','requests'].includes(page)&&<MerchantOps key={page} page={page as OpsPage} token={token!} workspace={workspace} onChange={()=>refresh()} onChoose={setChoosingTeam} onCatalogue={()=>navigate('business')} onPayments={()=>navigate('connections')} onAsk={askReadyTeam}/>}
              {page === "work" && (
                <>
                  <div className="office-heading office-merchant-welcome">
                    <div>
                      <span className="office-eyebrow">
                        YOUR DAY, WITH LESS BUSYWORK
                      </span>
                      <h1>Namaste, {workspace.business?.name}.</h1>
                      <p>
                        Choose a teammate. Give it work. Come back to a result
                        you can use.
                      </p>
                    </div>
                    <span className="office-heading-icon">
                      <Cloud size={29} />
                    </span>
                  </div>
                  <div className="office-summary">
                    <div>
                      <span>Saved bills</span>
                      <strong>{workspace.merchantOps?.summary.bills||0}</strong>
                    </div>
                    <div>
                      <span>Outstanding udhaar</span>
                      <strong>
                        ₹{((workspace.merchantOps?.summary.outstandingCreditPaise||0)/100).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span>Unmet customer requests</span>
                      <strong>{workspace.merchantOps?.summary.unmetRequests||0}</strong>
                    </div>
                    <div>
                      <span>Verified collections</span>
                      <strong>
                        ₹
                        {(
                          (workspace.brain?.snapshot.verifiedCollectionPaise ||
                            0) / 100
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                  <p className="office-cloud-summary"><Cloud size={15}/>{pending} cloud jobs running <span>·</span>{needsAttention} setups / orders need review <span>·</span>{completed} jobs completed <small>Totals cover saved workspace records.</small></p>
                  <div className="office-merchant-shortcuts"><button onClick={()=>navigate('counter')}><ShoppingBag size={21}/><span><strong>Make a bill</strong><small>Arjun’s counter</small></span><ArrowRight size={17}/></button><button onClick={()=>navigate('khata')}><BookOpen size={21}/><span><strong>Check udhaar</strong><small>Naina’s ledger</small></span><ArrowRight size={17}/></button><button onClick={()=>navigate('shop')}><Globe size={21}/><span><strong>Share my shop</strong><small>Tara’s storefront</small></span><ArrowRight size={17}/></button></div>
                  <ReadyTeamGallery workspace={workspace} busy={!!busy} onChoose={openReadyTeam}/>
                  <div className="office-section-heading">
                    <h2>Recent work</h2>
                    <button
                      className="office-text"
                      onClick={() => navigate("team")}
                    >
                      Open my team <ChevronRight size={16} />
                    </button>
                  </div>
                  {!recentWork.length ? (
                    <section className="office-empty">
                      <Cloud size={28} />
                      <div>
                        <h3>Your first result starts with a clear job.</h3>
                        <p>
                          Choose a teammate, review its setup, then give it work.
                          Every result stays in this workspace.
                        </p>
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
                              <h3>{s.businessName} · Business website</h3>
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
                                  Open live website <ArrowUpRight size={15} />
                                </a>
                              )}
                              <button className="office-text" onClick={() => navigate("website")}>Open website team <ChevronRight size={15} /></button>
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
                                    Working
                                  </span>
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
                                  Try again with current facts
                                </button>
                              )}
                            {t.result ? (
                              <>
                                <p className="office-work-preview">{t.result.output.replace(/[#*]/g, "").slice(0,200)}{t.result.output.length>200?"…":""}</p>
                                <details className="office-work-artifact"><summary>Read full result</summary>
                                <ResultText text={t.result.output} />
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
                                  Copy result
                                </button>
                                <div className="office-next">
                                  <strong>Next step</strong>
                                  <p>{t.result.nextStep}</p>
                                </div>
                                </details>
                                {t.result.sources.length > 0 && (
                                  <details>
                                    <summary>View business sources</summary>
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
                      <span className="office-eyebrow">
                        BUILT AROUND YOUR WORK
                      </span>
                      <h1>Your AI team.</h1>
                      <p>
                        Each team shares your business memory and works within
                        its own job and permissions.
                      </p>
                    </div>
                    <button
                      className="office-primary"
                      onClick={() => navigate("work")}
                    >
                      <Plus size={16} /> Choose another teammate
                    </button>
                  </div>
                  {!current ? (
                    <section className="office-empty">
                      <Users size={30} />
                      <h3>Choose your first ready teammate.</h3>
                      <button
                        className="office-primary"
                        onClick={() => navigate("work")}
                      >
                        Choose a ready teammate
                      </button>
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
                          <span className="office-eyebrow">
                            YOUR TEAM BRIEF
                          </span>
                          <Status value={current.state} />
                        </div>
                        <h2>{teamName(current)}</h2>
                        {teamName(current) !== current.plan.name && <p className="office-team-job">{current.plan.name}</p>}
                        <p className="office-team-outcome">
                          {readyTeams.find(t=>t.code===current.presetId)?.tag||current.plan.outcome}
                        </p>
                        {current.state==='active'&&<TeammateTask key={current.id} token={token!} team={current} workspace={workspace} initialRequest={task?.blueprintId===current.id?task.text:undefined} requestToEdit={task?.blueprintId===current.id&&task.version?{text:task.text,version:task.version}:undefined} onChange={()=>refresh()} onError={setError} onDesk={selectedReadyTeam(current.presetId)&&deskFor[current.presetId as ReadyTeamId]?()=>navigate(deskFor[current.presetId as ReadyTeamId]!):undefined}/>}
                        <details className="teammate-job-details" open={current.state!=='active'}><summary>Team, rules & approved job</summary><p>{current.plan.outcome}</p>
                        <div className="office-team-members">
                          {(current.team || []).map((m) => (
                            <article key={m.id}>
                              <PixelTeammate id={memberCharacter(m)} name={m.name} />
                              <div>
                                <strong>{m.name}</strong>
                                <span>{m.role}</span>
                                <small>{m.responsibility}</small>
                                {m.execution === "verified_code" && <small className="office-specialist-type">Verified code checks</small>}
                              </div>
                            </article>
                          ))}
                        </div>
                        <h3>How your team will work</h3>
                        <ul>
                          {current.plan.rules.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        </details>
                        {current.feasibility.blockers.length > 0 && (
                          <div className="office-setup-needed">
                            <h3>Before your team can go live</h3>
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
                                Connect apps
                              </button>
                              <button
                                className="office-text"
                                onClick={() => navigate("business")}
                              >
                                {current.plan.skills.some(s=>["bill_review","shop_publish"].includes(s))?"Add products & prices":"Update business facts"}
                              </button>
                            </div>
                          </div>
                        )}
                        {current.plan.alternative&&<div className="office-setup-needed"><h3>Choose a supported ready teammate</h3><p>This older job needs a supported scope. Choose a ready teammate and review its settings.</p><button className="office-secondary" onClick={()=>navigate("work")}>Browse ready teammates</button></div>}
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
                                <Pause size={15} /> Pause team
                              </>
                            ) : (
                              <>
                                <Play size={15} /> Activate team
                              </>
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
                            <RefreshCw size={15} /> Recheck setup
                          </button>
                          {selectedReadyTeam(current.presetId)&&deskFor[current.presetId as ReadyTeamId]&&current.state==='active'&&<button className="office-secondary" onClick={()=>navigate(deskFor[current.presetId as ReadyTeamId]!)}>Open teammate’s desk <ArrowRight size={15}/></button>}
                          {selectedReadyTeam(current.presetId)&&<><button className="office-secondary" disabled={!!busy} onClick={()=>setChoosingTeam(current.presetId as ReadyTeamId)}>Configure teammate</button><button className="office-text" disabled={!!busy} onClick={()=>{const url=new URL("/",location.origin);url.searchParams.set("team",current.presetId!);setRecipeCopied(false);setSharing({name:teamName(current),url:url.toString()})}}><Copy size={15}/> Share teammate</button></>}
                        </div>
                        <section className="office-team-results" aria-label="This teammate’s work">
                          <div className="office-card-head"><h3>This teammate’s work</h3><button className="office-text" onClick={()=>navigate('work')}>All workspace results <ArrowRight size={15}/></button></div>
                          {workspace.tasks.filter(t=>t.blueprintId===current.id).slice(-3).reverse().map((t,index)=><article className="office-team-result" key={t.id}>
                            <div className="office-card-head"><Status value={t.state}/><small>{new Date(t.createdAt).toLocaleString('en-IN')}</small></div>
                            <h4>{t.result?.title||t.text}</h4>{['failed','waiting_owner'].includes(t.state)&&<button className="office-secondary" disabled={!!busy} onClick={()=>setTask({blueprintId:current.id,text:t.text,version:Date.now()})}>Edit this task <RefreshCw size={14}/></button>}
                            {!!t.checkpoint?.stages.length&&<div className="office-stage-trail">{t.checkpoint.stages.map(s=><span key={s.role}><Check size={13}/>{s.specialistName} · {s.role==='specialist'?'Prepared':'Reviewed'}</span>)}</div>}
                            {t.result?<><details open={index===0}><summary>Read the result</summary><ResultText text={t.result.output}/><button className="office-text" onClick={()=>void act("Copying result",async()=>{await navigator.clipboard.writeText(t.result!.output);setNotice("Result copied. Review before sending or publishing.")})}><Copy size={14}/> Copy result</button><div className="office-next"><strong>Next step</strong><p>{t.result.nextStep}</p></div></details><details><summary>Business sources</summary>{t.result.sources.map((s,i)=><p key={i}>{s}</p>)}</details></>:<p>{t.reason||(['queued','working'].includes(t.state)?'Your cloud team is working. You can close this browser and return to the result.':'Open the approved job and recheck its setup to continue.')}</p>}
                          </article>)}
                          {!workspace.tasks.some(t=>t.blueprintId===current.id)&&<p className="office-footnote">Saved results and progress will appear here after your first task.</p>}
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
                      <h3>Payment evidence</h3>
                      {workspace.payments.map((p) => (
                        <div className="office-payment-row" key={p.id}>
                          <div>
                            <strong>
                              ₹{(p.amountPaise / 100).toLocaleString("en-IN")}
                            </strong>
                            <small>
                              {p.mode === "staging"
                                ? "Test payment"
                                : "Live payment"}{" "}
                              · {p.txnId || "No verified transaction yet"}
                            </small>
                          </div>
                          <Status value={p.state} />
                          {p.url && p.state !== "paid" && (
                            <a href={p.url} target="_blank" rel="noreferrer">
                              Open checkout <ArrowUpRight size={14} />
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
                            Verify status
                          </button>
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
                      <span className="office-eyebrow">
                        YOUR ACCOUNTS. YOUR AUTHORITY.
                      </span>
                      <h1>Connect your business.</h1>
                      <p>
                        Connect the apps your team needs, then approve what it
                        may do.
                      </p>
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
                                  connectApp(id, title, !!connected)
                                }
                              >
                                {connected ? "Continue connection" : "Connect"} <ArrowUpRight size={14} />
                              </button>
                            ) : (
                              <>
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
                                  Disconnect
                                </button>
                              </>
                            )}
                            {connected && <button className="office-secondary" disabled={!!busy} onClick={() => act("Checking app connection", async () => {
                              const result = await api.refreshConnection(token!, id) as {status?: string};
                              await refresh();
                              setNotice(result.status === "connected" ? `${title} is connected. Enable approved actions in its desk.` : `${title} still needs authorization. Choose Continue connection to try again.`);
                            })}>Check connection</button>}
                          </div>
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
                      <h3>WhatsApp</h3>
                      <p>
                        Pair your device with an isolated cloud session. Review
                        reply rules before enabling your team.
                      </p>
                      <button
                        className="office-secondary"
                        onClick={() => navigate("whatsapp")}
                      >
                        Set up WhatsApp <ChevronRight size={14} />
                      </button>
                    </article>
                    <article className="office-card">
                      <span className="office-app-icon">
                        <Brain size={24} />
                      </span>
                      <h3>Indian voice & shared memory</h3>
                      <p>
                        Speak your job with Sarvam. Save approved knowledge to
                        Cognee so your teammates use the same facts.
                      </p>
                      <span className="office-status">
                        Voice{" "}
                        {workspace.providers?.sarvam ? "ready" : "needs setup"}{" "}
                        · Memory{" "}
                        {workspace.providers?.cognee ? "ready" : "needs setup"}
                      </span>
                      <button
                        className="office-text"
                        onClick={() => navigate("business")}
                      >
                        Open shared memory <ChevronRight size={14} />
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
                  <div className="office-heading">
                    <div>
                      <span className="office-eyebrow">ONE BUSINESS BRAIN</span>
                      <h1>Your team knows what you approve.</h1>
                      <p>
                        Update your facts as your business changes. Your teams
                        will ask for a fresh review.
                      </p>
                    </div>
                  </div>
                  <section className="office-card">
                    <label>
                      Business playbook
                      <textarea
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
                        I’ve reviewed and approved these facts. No passwords,
                        payment keys or private customer details are included.
                      </span>
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
                      Save approved facts <Check size={16} />
                    </button>
                    <BusinessMemory
                      token={token}
                      enabled={!!workspace.providers?.cognee}
                    />
                  </section>
                  <Catalogue
                    token={token}
                    workspace={workspace}
                    ensureToken={async () => token!}
                    onChange={() => refresh()}
                  />
                  <SharedBrain workspace={workspace} />
                  <section className="office-card">
                    <h3>Workspace & account</h3>
                    <p>
                      {workspace.account?.saved
                        ? "Your verified account can recover this workspace on another device."
                        : "This guest workspace expires. Verify your email to save your business workspace."}
                    </p>
                    <p>
                      Available AI requests: {workspace.limits.modelsRemaining}.
                      App operations: {workspace.limits.toolsRemaining}.
                      {workspace.limits.resetAt &&
                        ` Usage resets ${new Date(workspace.limits.resetAt).toLocaleString("en-IN")}.`}
                    </p>
                    <button
                      className="office-secondary"
                      onClick={() => setAccountOpen(true)}
                    >
                      {workspace.account?.saved
                        ? "Sign in to another workspace"
                        : "Save workspace"}
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
                      Sign out of this browser
                    </button>
                  </section>
                </>
              )}
              </Suspense>
            </main>
            <footer className="office-footer">
              <span>kaamset · Made for the work of your business.</span>
              <span>Cloud work follows your facts and permissions.</span>
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
      {choosingTeam&&workspace&&<ReadyTeamSetup key={choosingTeam} code={choosingTeam} workspace={workspace} busy={!!busy} onClose={()=>setChoosingTeam(null)} onSave={configureReadyTeam}/>}
      {sharing&&<div className="office-modal-overlay"><section className="office-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"><button className="office-close" aria-label="Close teammate sharing" onClick={()=>setSharing(null)}><X size={20}/></button><h2 id="share-title">Share {sharing.name}</h2><p>Your partner chooses this ready teammate using their own business facts, connections and approvals.</p><label>Teammate setup link<input readOnly value={sharing.url} onFocus={e=>e.target.select()}/></label><p className="office-footnote">This link contains only the teammate choice. Your business records and connected accounts remain in your workspace.</p><button className="office-primary" onClick={async()=>{try{await navigator.clipboard.writeText(sharing.url);setRecipeCopied(true)}catch{setError('Copy could not finish. Select and copy the setup link above.')}}}><Copy size={16}/>{recipeCopied?'Link copied':'Copy setup link'}</button></section></div>}
    </div>
  );
}
