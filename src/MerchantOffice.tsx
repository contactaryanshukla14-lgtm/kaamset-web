import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Download,
  FileText,
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
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
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
import InboxPanel from "./InboxPanel";
import WebsiteStudio from "./WebsiteStudio";
import { BusinessMemory, ContentStudio, VoiceInput } from "./OwnerTools";
import {
  Catalogue,
  MilanScheduler,
  OrderDesk,
  SharedBrain,
} from "./MerchantTools";
import "./office.css";

const storageKey = "kaamset_workspace_token";

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
  return (
    <div className="office-result">
      {text.split(/\n\s*\n/).map((block, index) => {
        if (/^\s*---\s*$/.test(block)) return <hr key={index} />;
        if (/^#{1,4}\s/.test(block))
          return <h4 key={index}>{inline(block.replace(/^#{1,4}\s+/, ""))}</h4>;
        if (/^[-*]\s/.test(block))
          return (
            <ul key={index}>
              {block.split("\n").map((line, i) => (
                <li key={i}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        return <p key={index}>{inline(block)}</p>;
      })}
    </div>
  );
}
type Page =
  | "work"
  | "team"
  | "customers"
  | "marketing"
  | "website"
  | "assistant"
  | "orders"
  | "connections"
  | "business";
const pages = [
  { id: "work", label: "My work", Icon: LayoutDashboard },
  { id: "team", label: "My AI team", Icon: Users },
  { id: "customers", label: "Customer desk", Icon: MessageCircle },
  { id: "marketing", label: "Instagram studio", Icon: Instagram },
  { id: "website", label: "Website team", Icon: Globe },
  { id: "assistant", label: "Milan · Assistant", Icon: Activity },
  { id: "orders", label: "Orders & payments", Icon: FileText },
  { id: "connections", label: "Connections", Icon: Link2 },
  { id: "business", label: "Business & memory", Icon: Brain },
] as const;
const jobs = [
  {
    name: "A sales team",
    id: "milo",
    tag: "Enquiries → bookings → payments",
    text: "Create my sales team to answer enquiries from my connected Gmail and WhatsApp, qualify customers, quote approved products or services, capture orders and book appointments on my approved calendar. Send Paytm payment requests only after the customer accepts the exact quote. Follow up within my approved rules; escalate discounts, complaints and missing stock.",
  },
  {
    name: "My Instagram team",
    id: "riya",
    tag: "Content, comments & customer DMs",
    text: "Manage my business Instagram: plan captions and owner-approved photo posts, publish on my approved schedule, answer routine comments and eligible inbound DMs, qualify interest and coordinate approved bookings or orders. Ask me for content approval and commercial exceptions. Check each required account permission.",
  },
  {
    name: "Build my business website",
    id: "vijay",
    tag: "Assets → design → copy → live link",
    text: "Create and publish a polished mobile business website from my approved facts and photos. Use a team to curate assets, design the customer journey, write grounded copy and verify the site. Give me a usable KaamSet website link.",
  },
  {
    name: "A personal assistant",
    id: "milan",
    tag: "Remember commitments. Follow through.",
    text: "Act as Milan, my personal assistant. Draft personalised WhatsApp reminders and schedule exact messages I approve to opted-in contacts. Help me remember appointments and ask customers to share agreed payment details. Stop collection reminders once payment is verified.",
  },
];
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
  goal: "",
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
            Aap kaam bataiye.
            <br />
            <em>Team sambhal legi.</em>
          </h1>
          <p>
            Turn the work on your mind into a team that knows your business,
            uses your apps, and keeps working in the cloud.
          </p>
          <div className="office-crew-scene">
            <div className="scene-orbit" />
            <div className="scene-member scene-riya">
              <PixelTeammate id="riya" />
              <span>
                Riya <small>Marketing</small>
              </span>
            </div>
            <div className="scene-member scene-milo">
              <PixelTeammate id="milo" />
              <span>
                Milo <small>Sales</small>
              </span>
            </div>
            <div className="scene-member scene-vijay">
              <PixelTeammate id="vijay" />
              <span>
                Vijay <small>Websites</small>
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
                <h2>What work can we take off your plate?</h2>
                <p>Start with one outcome. You can add more teams later.</p>
                <label>
                  Describe the job
                  <textarea
                    autoFocus
                    value={setup.goal}
                    rows={4}
                    maxLength={2000}
                    onChange={(e) => field("goal", e.target.value)}
                    placeholder="Instagram par enquiries ka jawab do, appointments book karo, aur mujhe exceptions batao."
                    required
                  />
                </label>
                <div className="office-job-chips">
                  {jobs.map((j) => (
                    <button
                      type="button"
                      key={j.id}
                      onClick={() => field("goal", j.text)}
                    >
                      {j.name}
                    </button>
                  ))}
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
                    {step === 2 ? "Create my AI team" : "Continue"}
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
    [mode, setMode] = useState<"staging" | "production">("staging"),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
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
      <h3>Take the next step from a sale to a payment.</h3>
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
        <button className="office-secondary" onClick={onSaveAccount}>
          Save your business account to connect Paytm <ChevronRight size={16} />
        </button>
      ) : (
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
                onChange={(e) => setMid(e.target.value)}
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
              onChange={(e) => setKey(e.target.value)}
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
      )}
      <a
        href="https://dashboard.paytmpayments.com/login/"
        target="_blank"
        rel="noreferrer"
        className="office-text"
      >
        Find your merchant credentials in Paytm <ArrowUpRight size={14} />
      </a>
      <small className="office-footnote">
        Keys are encrypted on the server. Customer screens and teammates never
        receive them.
      </small>
    </section>
  );
}
export default function MerchantOffice() {
  const [token, setToken] = useState<string | null>(() =>
      localStorage.getItem(storageKey),
    ),
    [workspace, setWorkspace] = useState<WorkspaceState | null>(null),
    [page, setPage] = useState<Page>("work"),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [job, setJob] = useState(""),
    [task, setTask] = useState(""),
    [selected, setSelected] = useState(""),
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
    [sharing, setSharing] = useState<{
      name: string;
      request: string;
      rules: string[];
      format: string;
    } | null>(null);
  const tokenRef = useRef(token),
    inFlight = useRef(false),
    importFile = useRef<HTMLInputElement>(null);
  function acceptToken(next: string) {
    localStorage.setItem(storageKey, next);
    tokenRef.current = next;
    setToken(next);
    setWorkspace(null);
    setError("");
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
          setWorkspace(w);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        polling = false;
      }
    };
    void run();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void run();
    }, 6000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token]);
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
      const r = await api.onboard(setup, tokenRef.current || undefined);
      acceptToken(r.token);
      setWorkspace(r.workspace);
      sessionStorage.removeItem("kaamset_setup_draft");
      setJob(setup.goal);
      setBusy("Designing your team");
      const b = await api.build(r.token, setup.goal);
      setSelected(b.id);
      await refresh(r.token);
      setPage("team");
      setNotice(
        "Your team proposal is ready. Review its rules and any setup needed.",
      );
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
  async function build(request = job) {
    await act("Designing your team", async () => {
      if (!token) return;
      const b = await api.build(token, request);
      setSelected(b.id);
      await refresh();
      setPage("team");
    });
  }
  const current =
    workspace?.blueprints.find((b) => b.id === selected) ||
    workspace?.blueprints.at(-1);
  async function control(
    b: Teammate,
    action: "activate" | "pause" | "accept_scope",
  ) {
    await act("Updating your team", async () => {
      if (!token) return;
      const r = await api.teammateControl(token, b, action);
      if ("rebuild" in r) {
        setJob(r.rebuild);
        const rebuilt = await api.build(token, r.rebuild);
        setSelected(rebuilt.id);
      }
      await refresh();
    });
  }
  function navigate(next: Page) {
    setPage(next);
    setMenu(false);
  }
  const pending =
      workspace?.tasks.filter((t) => ["queued", "working"].includes(t.state))
        .length || 0,
    needsAttention =
      (workspace?.brain?.snapshot.awaitingOwner || 0) +
      (workspace?.blueprints.filter((b) => b.state === "proposed").length || 0),
    completed =
      workspace?.tasks.filter((t) => t.state === "completed").length || 0;
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
          <LoaderCircle className="spin" />
          <h2>Opening your cloud office</h2>
          {error && (
            <>
              <p className="office-error">{error}</p>
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
          <aside className={`office-sidebar ${menu ? "mobile-open" : ""}`}>
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
            <nav>
              {pages.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={page === id ? "selected" : ""}
                  onClick={() => navigate(id)}
                >
                  <Icon size={18} />
                  {label}
                  {id === "work" && pending > 0 && <b>{pending}</b>}
                </button>
              ))}
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
                aria-label="Open navigation"
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
            <main className="office-content">
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
              {page === "work" && (
                <>
                  <div className="office-heading">
                    <div>
                      <span className="office-eyebrow">
                        YOUR DAY, WITH LESS BUSYWORK
                      </span>
                      <h1>Namaste, {workspace.business?.name}.</h1>
                      <p>
                        Give your team an outcome. Come back to work you can
                        use.
                      </p>
                    </div>
                    <span className="office-heading-icon">
                      <Cloud size={29} />
                    </span>
                  </div>
                  <div className="office-summary">
                    <div>
                      <span>Working in the cloud</span>
                      <strong>{pending.toString().padStart(2, "0")}</strong>
                    </div>
                    <div>
                      <span>Ready to review</span>
                      <strong>
                        {needsAttention.toString().padStart(2, "0")}
                      </strong>
                    </div>
                    <div>
                      <span>Completed tasks</span>
                      <strong>{completed.toString().padStart(2, "0")}</strong>
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
                  <section className="office-composer">
                    <div className="office-composer-label">
                      <Sparkles size={18} />
                      <span>WHAT SHOULD YOUR NEXT TEAM DO?</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      placeholder="Describe the work in your own words. ‘Handle my salon enquiries and book appointments.’"
                    />
                    <div>
                      <VoiceInput
                        token={token}
                        enabled={!!workspace.providers?.sarvam}
                        onText={setJob}
                        onError={setError}
                      />
                      <button
                        className="office-primary"
                        disabled={!!busy || job.trim().length < 10}
                        onClick={() => build()}
                      >
                        Build my team <ArrowRight size={17} />
                      </button>
                    </div>
                  </section>
                  <div className="office-section-heading">
                    <h2>Start with work that matters.</h2>
                    <p>Use a starting brief, then make the team yours.</p>
                  </div>
                  <div className="office-job-grid">
                    {jobs.map((j) => (
                      <button
                        key={j.id}
                        className="office-job-card"
                        onClick={() => {
                          setJob(j.text);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <PixelTeammate id={j.id} />
                        <div>
                          <h3>{j.name}</h3>
                          <p>{j.tag}</p>
                        </div>
                        <ArrowUpRight size={18} />
                      </button>
                    ))}
                  </div>
                  <div className="office-section-heading">
                    <h2>Recent work</h2>
                    <button
                      className="office-text"
                      onClick={() => navigate("team")}
                    >
                      Open my team <ChevronRight size={16} />
                    </button>
                  </div>
                  {!workspace.tasks.length ? (
                    <section className="office-empty">
                      <Cloud size={28} />
                      <div>
                        <h3>Your first result starts with a clear job.</h3>
                        <p>
                          Create a team, review its setup, then give it work.
                          Every result stays in this workspace.
                        </p>
                      </div>
                    </section>
                  ) : (
                    <div className="office-work-list">
                      {workspace.tasks
                        .slice()
                        .reverse()
                        .slice(0, 8)
                        .map((t) => (
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
                                      ? "Prepared"
                                      : "Reviewed"}
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
                        ))}
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
                      <Plus size={16} /> New team
                    </button>
                  </div>
                  <input
                    hidden
                    type="file"
                    ref={importFile}
                    accept=".json"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        if (f.size > 20000)
                          throw new Error("Use a teammate recipe under 20 KB.");
                        const r = JSON.parse(await f.text());
                        if (
                          r.format !== "kaamset-teammate-v1" ||
                          typeof r.request !== "string" ||
                          r.request.length > 2000 ||
                          !Array.isArray(r.rules) ||
                          r.rules.some(
                            (x: unknown) =>
                              typeof x !== "string" || x.length > 300,
                          )
                        )
                          throw new Error(
                            "This is not a supported teammate recipe.",
                          );
                        setJob(
                          `${r.request}\nRules: ${r.rules.join("; ")}`.slice(
                            0,
                            2000,
                          ),
                        );
                        setNotice(
                          "Recipe loaded. Review the job text; your own facts and connections will be checked.",
                        );
                        navigate("work");
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  />
                  <button
                    className="office-text"
                    onClick={() => importFile.current?.click()}
                  >
                    <Upload size={15} /> Import a partner’s teammate recipe
                  </button>
                  {!current ? (
                    <section className="office-empty">
                      <Users size={30} />
                      <h3>Describe a job to create your first team.</h3>
                      <button
                        className="office-primary"
                        onClick={() => navigate("work")}
                      >
                        Create a team
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
                            <PixelTeammate id={b.character} />
                            <div>
                              <strong>{b.plan.name}</strong>
                              <small>{label(b.state)}</small>
                            </div>
                            <ChevronRight size={15} />
                          </button>
                        ))}
                      </aside>
                      <section className="office-card office-team-detail">
                        <div className="office-card-head">
                          <span className="office-eyebrow">
                            YOUR TEAM BRIEF
                          </span>
                          <Status value={current.state} />
                        </div>
                        <h2>{current.plan.name}</h2>
                        <p className="office-team-outcome">
                          {current.plan.outcome}
                        </p>
                        <div className="office-team-members">
                          {(current.team || []).map((m) => (
                            <article key={m.id}>
                              <PixelTeammate id={m.id} />
                              <div>
                                <strong>{m.name}</strong>
                                <span>{m.role}</span>
                                <small>{m.responsibility}</small>
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
                                Update business facts
                              </button>
                            </div>
                          </div>
                        )}
                        {current.plan.alternative && (
                          <div className="office-setup-needed">
                            <h3>An achievable job to start with</h3>
                            <p>{current.plan.alternative}</p>
                            {current.plan.assessment ===
                              "needs_scope_change" && (
                              <button
                                className="office-secondary"
                                disabled={!!busy}
                                onClick={() => control(current, "accept_scope")}
                              >
                                Accept and check this job
                              </button>
                            )}
                          </div>
                        )}
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
                          <button
                            className="office-text"
                            disabled={!!busy}
                            onClick={() =>
                              act("Preparing teammate recipe", async () =>
                                setSharing(
                                  await api.recipe(token!, current.id),
                                ),
                              )
                            }
                          >
                            <Download size={15} /> Share recipe
                          </button>
                        </div>
                        {current.state === "active" && (
                          <div className="office-team-task">
                            <label>
                              Give your team a task
                              <textarea
                                rows={3}
                                maxLength={2000}
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="Prepare customer replies for today’s offer. Explain what needs my attention…"
                              />
                            </label>
                            <div className="office-actions">
                              <button
                                className="office-primary"
                                disabled={
                                  !!busy || !!pending || task.trim().length < 3
                                }
                                onClick={() =>
                                  act(
                                    "Sending work to your cloud team",
                                    async () => {
                                      await api.runTeammate(
                                        token!,
                                        current.id,
                                        task,
                                      );
                                      await refresh();
                                      navigate("work");
                                    },
                                  )
                                }
                              >
                                Prepare & review <Send size={15} />
                              </button>
                              {current.plan.skills.includes(
                                "website_publish",
                              ) && (
                                <button
                                  className="office-secondary"
                                  onClick={() => navigate("website")}
                                >
                                  Build a live website
                                </button>
                              )}
                              {current.plan.skills.some((s) =>
                                [
                                  "instagram_dm",
                                  "gmail_sales",
                                  "whatsapp_enquiries",
                                ].includes(s),
                              ) && (
                                <button
                                  className="office-secondary"
                                  onClick={() => navigate("customers")}
                                >
                                  Enable customer desk
                                </button>
                              )}
                              {current.plan.skills.includes(
                                "instagram_publish",
                              ) && (
                                <button
                                  className="office-secondary"
                                  onClick={() => navigate("marketing")}
                                >
                                  Publish approved content
                                </button>
                              )}
                              {current.plan.skills.includes(
                                "whatsapp_schedule",
                              ) && (
                                <button
                                  className="office-secondary"
                                  onClick={() => navigate("assistant")}
                                >
                                  Schedule a reminder
                                </button>
                              )}
                            </div>
                            <p className="office-footnote">
                              Prepare & review creates an internal artifact.
                              Connected customer replies, publishing, bookings
                              and reminders run from their dedicated desks with
                              your approved rules.
                            </p>
                          </div>
                        )}
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
              {page === "marketing" && (
                <ContentStudio
                  token={token}
                  teammates={workspace.blueprints}
                  posts={workspace.posts || []}
                  onChange={() => refresh()}
                />
              )}
              {page === "website" && (
                <WebsiteStudio
                  token={token}
                  workspace={workspace}
                  onChange={() => refresh()}
                  onBuild={() => {
                    setJob(jobs[2].text);
                    navigate("work");
                  }}
                />
              )}
              {page === "assistant" && (
                <MilanScheduler
                  token={token}
                  workspace={workspace}
                  onChange={() => refresh()}
                  onPair={() => navigate("customers")}
                  onBuild={() => {
                    setJob(jobs[3].text);
                    navigate("work");
                  }}
                />
              )}
              {page === "orders" && (
                <>
                  <OrderDesk
                    token={token}
                    workspace={workspace}
                    onChange={() => refresh()}
                  />
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
                            {!connected ? (
                              <button
                                className="office-secondary"
                                disabled={!!busy}
                                onClick={() =>
                                  act(
                                    `Opening ${title} connection`,
                                    async () => {
                                      const r = await api.connect(token!, id);
                                      await refresh();
                                      window.location.assign(r.url);
                                    },
                                  )
                                }
                              >
                                Connect <ArrowUpRight size={14} />
                              </button>
                            ) : (
                              <>
                                <button
                                  className="office-secondary"
                                  disabled={!!busy}
                                  onClick={() =>
                                    act("Checking app connection", async () => {
                                      await api.refreshConnection(token!, id);
                                      await refresh();
                                    })
                                  }
                                >
                                  Check connection
                                </button>
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
                        onClick={() => navigate("customers")}
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
      {sharing && (
        <div className="office-modal-overlay">
          <section
            className="office-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
          >
            <button
              className="office-close"
              aria-label="Close recipe sharing"
              onClick={() => setSharing(null)}
            >
              <X size={20} />
            </button>
            <h2 id="share-title">Share a teammate recipe</h2>
            <p>
              Your partner can import this job into their own workspace. Review
              this text for private names, contacts or commercial information
              before downloading.
            </p>
            <label>
              Job to share
              <textarea
                rows={6}
                maxLength={2000}
                value={sharing.request}
                onChange={(e) =>
                  setSharing({ ...sharing, request: e.target.value })
                }
              />
            </label>
            <details>
              <summary>Included operating rules</summary>
              {sharing.rules.map((r, i) => (
                <p key={i}>{r}</p>
              ))}
            </details>
            <p className="office-footnote">
              The file excludes your business playbook, connections, customer
              messages, payment credentials and receipts. Your partner must
              approve their own setup.
            </p>
            <button
              className="office-primary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(sharing, null, 2)], {
                    type: "application/json",
                  }),
                  url = URL.createObjectURL(blob),
                  a = document.createElement("a");
                a.href = url;
                a.download = "kaamset-teammate.json";
                a.click();
                URL.revokeObjectURL(url);
                setSharing(null);
              }}
            >
              Download reviewed recipe <Download size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
