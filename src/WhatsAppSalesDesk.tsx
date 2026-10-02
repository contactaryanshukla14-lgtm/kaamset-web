import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3, Cloud, CreditCard,
  LoaderCircle, MessageCircle, Pause, Play, RefreshCw, Search, Send,
  Settings2, ShieldCheck, UserRound, Wifi, WifiOff,
} from "lucide-react";
import {
  api, type Teammate, type WhatsAppConversation, type WhatsAppSalesSetup,
  type WhatsAppSalesState, type WhatsAppState, type WorkspaceState,
} from "./api";
import PixelTeammate from "./PixelTeammate";
import { memberCharacter, teamName } from "./team-identity";
import "./whatsapp-sales.css";

const empty: WhatsAppSalesState = { conversations: [], outbox: [], digests: [] };
const money = (paise: number | null | undefined) => paise == null ? "Owner confirmation needed" :
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const when = (value?: string) => value && Number.isFinite(Date.parse(value)) ?
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not scheduled";
const stageLabels: Record<WhatsAppConversation["stage"], string> = {
  enquiry: "Enquiry", quote: "Quote", awaiting_payment: "Awaiting payment", paid: "Paid", owner_needed: "Owner needed",
};
const stateLabel = (value: string) => value.replaceAll("_", " ");
const contactLabel = (value: string) => value.endsWith("@lid") ? "WhatsApp customer" : value.replace(/@(c\.us|s\.whatsapp\.net)$/, "");
function Status({ value, children }: { value: string; children?: ReactNode }) {
  return <span className={`wa-badge wa-badge-${value}`}>{children || stateLabel(value)}</span>;
}

function SalesRules({ teams, current, busy, onSave }: {
  teams: Teammate[]; current?: WhatsAppSalesState["settings"]; busy: boolean;
  onSave: (settings: WhatsAppSalesSetup) => Promise<boolean>;
}) {
  const defaults = (): WhatsAppSalesSetup => ({
    approved: true, blueprintId: current?.blueprintId || teams.at(-1)?.id || "",
    language: current?.language || "auto", tone: current?.tone || "friendly",
    deliveryArea: current?.deliveryArea || null, discountLimitPercent: current?.discountLimitPercent ?? 0,
    ownerHelp: current?.ownerHelp || ["Complaints, refunds and cancellations", "Missing stock, delivery facts or booking availability", "Discounts and commercial exceptions"],
    followup: current?.followup || { enabled: false, afterMinutes: [1440], quietStart: 21, quietEnd: 9 },
    summary: current?.summary || { enabled: true, at: "19:00" },
  });
  const [draft, setDraft] = useState<WhatsAppSalesSetup>(defaults);
  const [approved, setApproved] = useState(false), [reminders, setReminders] = useState(draft.followup.afterMinutes.join(", "));
  const [ownerHelp, setOwnerHelp] = useState(draft.ownerHelp.join("\n"));
  const dirty = useRef(false), observed = useRef(JSON.stringify(current));
  const [serverChanged, setServerChanged] = useState(false);
  function reload() {
    const next = defaults();
    setDraft(next); setReminders(next.followup.afterMinutes.join(", ")); setOwnerHelp(next.ownerHelp.join("\n"));
    dirty.current = false; observed.current = JSON.stringify(current); setServerChanged(false); setApproved(false);
  }
  useEffect(() => {
    const signature = JSON.stringify(current);
    if (observed.current === signature) return;
    observed.current = signature; setApproved(false);
    if (dirty.current) { setServerChanged(true); return; }
    reload();
  }, [current]);
  const helpLines = ownerHelp.split("\n").map((s) => s.trim()).filter(Boolean);
  const validHelp = helpLines.length <= 4 && helpLines.every((s) => s.length >= 3 && s.length <= 200);
  const validArea = !draft.deliveryArea?.trim() || draft.deliveryArea.trim().length >= 2;
  const minutes = reminders.split(",").map((s) => Number(s.trim()));
  const validReminders = !draft.followup.enabled || minutes.length >= 1 && minutes.length <= 3 &&
    minutes.every((m, i) => Number.isInteger(m) && m >= 15 && m <= 10080 && (!i || m > minutes[i - 1]));
  const validDiscount = Number.isInteger(draft.discountLimitPercent) && draft.discountLimitPercent >= 0 && draft.discountLimitPercent <= 30;
  const validSummary = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.summary.at);
  const validTeam = teams.some((team) => team.id === draft.blueprintId);
  const edited = (next: WhatsAppSalesSetup) => { dirty.current = true; setDraft(next); setApproved(false); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!approved || !validTeam || !validReminders || !validHelp || !validArea || !validDiscount || !validSummary || serverChanged || busy) return;
    const saved = await onSave({ ...draft, deliveryArea: draft.deliveryArea?.trim() || null,
      ownerHelp: helpLines,
      followup: { ...draft.followup, afterMinutes: draft.followup.enabled ? minutes : draft.followup.afterMinutes } });
    if (saved) { dirty.current = false; setApproved(false); setServerChanged(false); }
  }
  return <form className="wa-rules" onSubmit={submit}>
    <div className="wa-section-title"><div><span className="office-eyebrow">ONLY THE RULES THIS JOB NEEDS</span><h3>How should Saathi work for you?</h3></div><Settings2 size={22} /></div>
    {serverChanged && <div className="wa-approval-summary" role="status"><div><strong>Your saved sales rules changed.</strong><p>Your edits are preserved. Reload the latest rules before approving another change.</p><button type="button" className="office-text" disabled={busy} onClick={reload}>Reload saved rules</button></div></div>}
    <fieldset className="wa-rules-fields" disabled={busy}>
    <div className="office-form-row">
      <label>Which team?<select value={draft.blueprintId} onChange={(e) => edited({ ...draft, blueprintId: e.target.value })} required>
        <option value="">{teams.length ? "Choose a WhatsApp team" : "Set up your WhatsApp team first"}</option>
        {teams.map((t) => <option value={t.id} key={t.id}>{teamName(t)} · {stateLabel(t.state)}</option>)}
      </select></label>
      <label>Replies in<select value={draft.language} onChange={(e) => edited({ ...draft, language: e.target.value as WhatsAppSalesSetup["language"] })}>
        <option value="auto">Customer’s language · English, Hindi or Hinglish</option><option value="hinglish">Hinglish</option><option value="hi">Hindi</option><option value="en">English</option>
      </select></label>
      <label>Tone<select value={draft.tone} onChange={(e) => edited({ ...draft, tone: e.target.value as WhatsAppSalesSetup["tone"] })}><option value="friendly">Warm & friendly</option><option value="professional">Professional</option></select></label>
      <label>Delivery / service area <small>Optional</small><input maxLength={200} value={draft.deliveryArea || ""} placeholder="e.g. Pickup only, or Baner and Aundh" onChange={(e) => edited({ ...draft, deliveryArea: e.target.value })} /></label>
    </div>
    <label>Discount requests above this limit need your help (%)<input type="number" min={0} max={30} step={1} value={draft.discountLimitPercent} onChange={(e) => edited({ ...draft, discountLimitPercent: Number(e.target.value) })} /></label>
    <p className="wa-help">Quoted amounts come from approved prices. This limit helps route discount requests; it does not authorise changing your prices.</p>
    {!validDiscount && <p className="wa-form-error" role="alert">Use a whole-number discount limit from 0 to 30.</p>}
    <label>When should the team ask you?<textarea rows={3} maxLength={800} value={ownerHelp} onChange={(e) => { dirty.current = true; setOwnerHelp(e.target.value); setApproved(false); }} /><small>Up to 4 rules, one per line. Keep each under 200 characters.</small></label>
    {!validHelp && <p className="wa-form-error" role="alert">Use up to 4 owner-help rules, with 3–200 characters per line.</p>}
    {!validArea && <p className="wa-form-error" role="alert">Describe the service area with at least 2 characters, or leave it empty for owner confirmation.</p>}
    <fieldset className="wa-rule-group"><legend>Unpaid payment reminders</legend>
      <label className="office-check"><input type="checkbox" checked={draft.followup.enabled} onChange={(e) => edited({ ...draft, followup: { ...draft.followup, enabled: e.target.checked } })} /><span>Let Milan follow up on accepted, unpaid orders</span></label>
      {draft.followup.enabled && <div className="wa-followup-options office-view-enter">
        <label>Minutes after the payment request<input value={reminders} onChange={(e) => { dirty.current = true; setReminders(e.target.value); setApproved(false); }} placeholder="e.g. 60, 1440" inputMode="text" /><small>Up to 3 increasing times, 15 minutes to 7 days.</small></label>
        {!validReminders && <p className="wa-form-error" role="alert">Use 1–3 increasing whole numbers, for example 60, 1440.</p>}
        <p className="wa-help">Milan stops reminders after verified payment, customer opt-out or owner takeover.</p>
      </div>}
    </fieldset>
    <fieldset className="wa-rule-group"><legend>WhatsApp sending hours · India time</legend><div className="office-form-row">{(["quietStart", "quietEnd"] as const).map((key) => <label key={key}>{key === "quietStart" ? "Quiet hours begin" : "Resume automatic sending at"}<select value={draft.followup[key]} onChange={(e) => edited({ ...draft, followup: { ...draft.followup, [key]: Number(e.target.value) } })}>{Array.from({ length: 24 }, (_,h) => <option key={h} value={h}>{String(h).padStart(2,"0")}:00 IST</option>)}</select></label>)}</div><p className="wa-help">Automatic and scheduled messages wait during your quiet hours.{draft.followup.quietStart === draft.followup.quietEnd && " Equal times mean no quiet period."}</p></fieldset>
    <div className="wa-summary-option"><label className="office-check"><input type="checkbox" checked={draft.summary.enabled} onChange={(e) => edited({ ...draft, summary: { ...draft.summary, enabled: e.target.checked } })} /><span>Prepare my daily summary in this workspace</span></label>{draft.summary.enabled && <label>India time<input type="time" value={draft.summary.at} required onChange={(e) => edited({ ...draft, summary: { ...draft.summary, at: e.target.value } })} /></label>}</div>
    <div className="wa-approval-summary"><ShieldCheck size={21} /><div><strong>Review the job before it goes live</strong><p>Tara handles enquiries and asks customers to accept an exact quote. Chotu requests and verifies Paytm payment. {draft.followup.enabled ? "Milan follows your reminder schedule." : "No automatic payment reminders."} Sending follows your quiet hours. Missing facts and commercial exceptions come to you. A payment is separate from delivery or fulfilment.</p></div></div>
    <label className="office-check"><input type="checkbox" checked={approved} disabled={serverChanged} onChange={(e) => setApproved(e.target.checked)} /><span>I approve these reply, payment and follow-up rules for my business.</span></label>
    </fieldset>
    <button className="office-primary" disabled={busy || serverChanged || !approved || !validTeam || !validReminders || !validHelp || !validArea || !validDiscount || !validSummary}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Save approved job rules</button>
  </form>;
}

export default function WhatsAppSalesDesk({ token, workspace, onChange, onBuild, onBusiness, onTeam, paymentSettings }: {
  token: string | null; workspace: WorkspaceState; onChange: () => Promise<unknown>;
  onBuild: () => void; onBusiness: () => void; onTeam: (id: string) => void; paymentSettings: ReactNode;
}) {
  const [wa, setWa] = useState<WhatsAppState | null>(null), [sales, setSales] = useState<WhatsAppSalesState>(workspace.whatsappSales || empty);
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [readError, setReadError] = useState(""), [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(""), [search, setSearch] = useState(""), [filter, setFilter] = useState("all"), [reply, setReply] = useState("");
  const [editing, setEditing] = useState(false), [liveConsent, setLiveConsent] = useState(false);
  const actionInFlight = useRef(false), chat = useRef<HTMLDivElement>(null);
  const readSequence = useRef(0), tokenRef = useRef(token);
  tokenRef.current = token;
  const replyAttempt = useRef<{ conversationId: string; text: string; key: string } | null>(null);
  const teams = workspace.blueprints.filter((b) => b.plan.skills.includes("whatsapp_enquiries"));
  const assigned = teams.find((b) => b.id === sales.settings?.blueprintId);
  const missingSkills = assigned ? [
    ["order_capture", "Prepare approved quotes and capture orders"],
    ["paytm_request", "Request and verify Paytm payments"],
    ...(sales.settings?.followup.enabled ? [["whatsapp_sales_followup", "Follow up on unpaid accepted orders"]] : []),
  ].filter(([skill]) => !assigned.plan.skills.includes(skill)).map(([,description]) => description) : [];
  const connected = wa?.state === "connected", enabled = !!wa?.salesAutoReplyEnabled;
  const hasPaytm = !!workspace.paymentSetup?.configured, hasOffers = !!workspace.commerce?.offers.length;
  const controlled = !!workspace.controls?.humanTakeover || !!workspace.controls?.paused;
  const running = enabled && connected && !controlled && assigned?.state === "active";
  const current = sales.conversations.find((c) => c.id === selected);
  const rows = sales.conversations.filter((c) => (filter === "all" || c.stage === filter) &&
    `${c.customerName} ${c.recipient}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  const selectedOrders = workspace.commerce?.orders.filter((o) => current?.orderIds.includes(o.id)) || [];
  const currentOutbox = sales.outbox.filter((o) => o.conversationId === current?.id);
  const followups = currentOutbox.filter((o) => o.kind === "payment_followup" && ["pending", "sending"].includes(o.state));
  const pendingActions = currentOutbox.filter((o) => ["uncertain", "owner_needed"].includes(o.state));
  const queuedReplies = currentOutbox.filter((o) => o.kind !== "payment_followup" && ["pending", "sending"].includes(o.state));
  const speaker = workspace.blueprints.find((b) => b.id === current?.speakerBlueprintId);
  const speakerName = speaker?.teamIdentity?.lead || "Tara";
  const pairing = wa && ["pairing", "qr", "connecting", "reconnecting"].includes(wa.state);
  const showPairingQr = wa?.state === "qr" && !!wa.qr;
  const pairingError = pairing ? undefined : wa?.error && wa.canLink && /qr|pairing|expired|timed out/i.test(wa.error)
    ? "The pairing code expired. Choose Show pairing QR for a fresh code, then scan it in WhatsApp."
    : wa?.error;
  const latestDigest = sales.digests.at(-1);

  async function read() {
    if (!token) return;
    const sequence = ++readSequence.current;
    const [linkState, desk] = await Promise.allSettled([api.whatsapp(token), api.whatsappSales(token)]);
    if (tokenRef.current !== token || sequence !== readSequence.current) return;
    const errors: string[] = [];
    if (linkState.status === "fulfilled") setWa(linkState.value);
    else errors.push(`WhatsApp connection: ${linkState.reason instanceof Error ? linkState.reason.message : "could not load"}`);
    if (desk.status === "fulfilled") setSales(desk.value);
    else errors.push(`Customer desk: ${desk.reason instanceof Error ? desk.reason.message : "could not load"}`);
    setLoaded(true); setReadError(errors.join(" "));
  }
  async function act(title: string, fn: () => Promise<unknown>) {
    if (actionInFlight.current || !token) return false;
    actionInFlight.current = true; setBusy(title); setError("");
    try { await fn(); await Promise.all([read(), onChange()]); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "This action could not be confirmed. Refresh the desk before retrying."); await read(); return false; }
    finally { actionInFlight.current = false; setBusy(""); }
  }
  useEffect(() => {
    setWa(null); setSales(workspace.whatsappSales || empty); setLoaded(false); setSelected(""); setReply(""); replyAttempt.current = null;
    if (!token) return;
    let cancelled = false, polling = false;
    async function poll() {
      if (polling) return;
      polling = true;
      const sequence = ++readSequence.current;
      try {
        const [linkState, desk] = await Promise.allSettled([api.whatsapp(token!), api.whatsappSales(token!)]);
        if (!cancelled && sequence === readSequence.current) {
          const errors: string[] = [];
          if (linkState.status === "fulfilled") setWa(linkState.value);
          else errors.push(`WhatsApp connection: ${linkState.reason instanceof Error ? linkState.reason.message : "could not load"}`);
          if (desk.status === "fulfilled") setSales(desk.value);
          else errors.push(`Customer desk: ${desk.reason instanceof Error ? desk.reason.message : "could not load"}`);
          setReadError(errors.join(" ")); setLoaded(true);
        }
      } catch (e) { if (!cancelled) { setReadError((e as Error).message); setLoaded(true); } }
      finally { polling = false; }
    }
    void poll();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void poll(); }, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [token]);
  useEffect(() => { setReply(""); }, [selected]);
  useEffect(() => { setLiveConsent(false); }, [sales.settings?.revision, assigned?.revision]);
  useEffect(() => {
    if (!sales.conversations.some((conversation) => conversation.id === selected)) setSelected(sales.conversations[0]?.id || "");
  }, [selected, sales.conversations]);
  useEffect(() => {
    const node = chat.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [selected, current?.history.length]);
  async function goLive() {
    await act("Checking and starting your WhatsApp team", async () => {
      if (!assigned || !liveConsent || !token || missingSkills.length) return;
      let enabledForCheck = false;
      try {
        if (!enabled) { await api.whatsappAction(token, "enable"); enabledForCheck = true; }
        const checked = await api.recheckTeammate(token, assigned);
        if (checked.feasibility.state !== "ready_to_test") throw new Error(checked.feasibility.blockers.join(" ") || "Review the remaining team setup before going live.");
        await api.teammateControl(token, checked, "activate");
        setLiveConsent(false);
      } catch (error) {
        if (enabledForCheck) {
          try { await api.whatsappAction(token, "disable"); }
          catch { throw new Error(`${error instanceof Error ? error.message : "Activation failed."} Automatic reply status could not be confirmed. Refresh the desk and pause WhatsApp before retrying.`); }
        }
        throw error;
      }
    });
  }

  return <section className="wa-desk">
    <div className="office-heading wa-heading"><div><span className="office-eyebrow">SAATHI · WHATSAPP SALES & PAYMENTS</span><h1>From “Kitna hai?” to paid.</h1><p>Your customer talks to one teammate. Your sales team does the work behind the scenes.</p></div><PixelTeammate id="tara" state={enabled && connected && !controlled ? "active" : "idle"} /></div>
    {(error || readError) && <div className="office-error" role="alert"><span>{error || `Could not refresh the desk. ${readError}`}</span><button aria-label="Dismiss message" onClick={() => { setError(""); setReadError(""); }}>×</button></div>}
    {busy && <div className="office-busy" role="status"><LoaderCircle size={16} className="spin" />{busy}</div>}
    <div className="wa-health">
      <div><span className={`wa-connection-icon ${connected ? "is-connected" : ""}`}>{connected ? <Wifi size={20} /> : <WifiOff size={20} />}</span><div><strong>{connected ? "WhatsApp connected" : pairing ? "Pair your account" : wa?.canReconnect ? "Reconnect required" : "Connect WhatsApp"}</strong><small>{wa?.phone || (loaded ? "Your own isolated linked-device session" : "Checking your cloud session…")}</small></div></div>
      <div><Status value={enabled && connected && !controlled && assigned?.state === "active" ? "active" : "paused"}>{enabled && connected && !controlled && assigned?.state === "active" ? "Teammate is live" : "Automatic replies paused"}</Status><button className="office-icon-button" aria-label="Refresh WhatsApp desk" disabled={!!busy} onClick={() => act("Refreshing your desk", read)}><RefreshCw size={16} /></button></div>
    </div>
    <div className="wa-journey" aria-label="Customer journey">{["Enquiry", "Approved quote", "Customer accepts", "Paytm checkout", "Verified payment"].map((step,i) => <div key={step}><span>{String(i+1).padStart(2,"0")}</span>{step}{i < 4 && <ChevronRight size={15} />}</div>)}</div>

    <details className="office-card wa-setup" open={!sales.settings || !connected || !hasPaytm || !hasOffers || assigned?.state !== "active" || editing} onToggle={(e) => { if (!e.currentTarget.open) setEditing(false); }}>
      <summary><div><Settings2 size={19} /><strong>{sales.settings && connected && hasPaytm && hasOffers ? "Your setup & approved rules" : "Let’s get your sales team ready"}</strong></div><span>3 simple steps <ChevronRight size={16} /></span></summary>
      <div className="wa-setup-body">
        <div className="wa-setup-steps">
          <article><span className={`wa-step-number ${workspace.briefApproved && hasOffers ? "done" : ""}`}>{workspace.briefApproved && hasOffers ? <Check size={16} /> : "1"}</span><h3>Tell us your business</h3><p>{hasOffers ? `${workspace.commerce!.offers.length} approved offers. Review stock, prices and business hours.` : "Add your products or services, approved prices, stock and hours."}</p><button className="office-text" onClick={onBusiness}>Edit business facts <ArrowRight size={14} /></button></article>
          <article><span className={`wa-step-number ${connected && hasPaytm ? "done" : ""}`}>{connected && hasPaytm ? <Check size={16} /> : "2"}</span><h3>Connect your accounts</h3><p>Scan WhatsApp’s QR. Connect Paytm once for this business.</p><Status value={hasPaytm ? "connected" : "needs_setup"}>{hasPaytm ? `Paytm ${workspace.paymentSetup?.mode === "production" ? "live mode" : "test mode"}` : "Paytm needs setup"}</Status></article>
          <article><span className={`wa-step-number ${sales.settings && assigned?.state === "active" && enabled ? "done" : ""}`}>{sales.settings && assigned?.state === "active" && enabled ? <Check size={16} /> : "3"}</span><h3>Approve & go live</h3><p>Review who replies, when to follow up and when the team asks you.</p>{!teams.length ? <button className="office-text" onClick={onBuild}>Set up Aarav <ArrowRight size={14} /></button> : <button className="office-text" onClick={() => onTeam(assigned?.id || teams.at(-1)!.id)}>Review my team <ArrowRight size={14} /></button>}</article>
        </div>
        <section className="wa-pairing">
          <div><span className="office-eyebrow">WHATSAPP · YOUR CLOUD SESSION</span><h3>{connected ? "Your account is paired." : pairing ? "Scan to pair your business number." : "Bring your WhatsApp conversations here."}</h3><p>On your phone, open WhatsApp → Settings → Linked devices → Link a device. Only scan this QR for your own account.</p>{pairingError && <p className="wa-form-error">{pairingError}</p>}
            {!connected && <p className="wa-help">{wa?.canReconnect ? "Your cloud session lost its connection. Reconnect here; saved conversations and orders stay in your workspace." : "KaamSet runs the linked session in the cloud. Your computer can be off while that session stays connected."}</p>}
            {loaded && wa && !wa.linked && !wa.canLink && !wa.canReconnect && !wa.error && <p className="wa-form-error">Cloud pairing is unavailable for this workspace. Your setup stays saved; the connection must be enabled before the team can reply.</p>}
            <div className="office-actions">{wa?.canLink && <button className="office-primary" disabled={!!busy} onClick={() => act("Preparing your pairing QR", () => api.whatsappAction(token!,"link"))}>Show pairing QR <MessageCircle size={16} /></button>}{wa?.canReconnect && <button className="office-primary" disabled={!!busy} onClick={() => act("Reconnecting your cloud WhatsApp session", () => api.whatsappAction(token!,"reconnect"))}>Reconnect <RefreshCw size={16} /></button>}{wa?.linked && <button className="office-text" disabled={!!busy} onClick={() => act("Unlinking this WhatsApp device", () => api.whatsappAction(token!,"unlink"))}>Unlink device</button>}</div>
            <small>Uses the existing WhatsApp Web linked-device adapter. Your account remains subject to WhatsApp’s linked-device requirements.</small>
          </div>{showPairingQr && <div className="wa-qr"><QRCodeSVG value={wa!.qr!} size={196} marginSize={4} /><span>Scan in WhatsApp · Linked devices</span></div>}{pairing && !showPairingQr && <div className="wa-qr-pending" role="status"><LoaderCircle size={28} className="spin" /><p>{wa.state === "pairing" ? "Finishing your connection…" : "Preparing your QR…"}</p></div>}
        </section>
        {paymentSettings}
        {!loaded ? <p role="status">Loading your saved sales rules…</p> : teams.length ? <SalesRules teams={teams} current={sales.settings} busy={!!busy} onSave={(settings) => act("Saving your approved sales rules", () => api.configureWhatsAppSales(token!, settings))} /> : <div className="wa-build-first"><PixelTeammate id="tara" /><div><h3>Meet Aarav’s customer team.</h3><p>Enable WhatsApp on your ready customer team. Add the live sales modules you want, then review permissions and activate.</p><button className="office-primary" onClick={onBuild}>Set up Aarav’s WhatsApp team <ArrowRight size={16} /></button></div></div>}
      </div>
    </details>

    {!!sales.settings && <section className="office-card wa-live-control">
      <div><strong>{assigned ? teamName(assigned) : "Select a WhatsApp team"}</strong><p>{running ? "Routine replies follow your approved business facts and rules." : "Your rules are saved. Complete the setup, then start your team."}</p>{controlled && <p className="wa-form-error">Your whole office is paused or in owner takeover. Resume it from the top bar first.</p>}{!!missingSkills.length && <div className="wa-form-error"><p>This team still needs these jobs before it can handle the full sale:</p><ul>{missingSkills.map((s) => <li key={s}>{s}</li>)}</ul><button className="office-text" onClick={onBuild}>Configure Aarav’s live modules <ArrowRight size={14} /></button></div>}</div>
      {running ? <button className="office-secondary" disabled={!!busy} onClick={() => act("Pausing WhatsApp automation", () => api.whatsappAction(token!,"disable"))}><Pause size={16} /> Pause WhatsApp</button> : <div><label className="office-check"><input type="checkbox" checked={liveConsent} onChange={(e) => setLiveConsent(e.target.checked)} /><span>Let this team handle new eligible customer messages using my approved rules.</span></label><button className="office-primary" disabled={!!busy || !assigned || !connected || !hasPaytm || !hasOffers || !liveConsent || controlled || !!readError || !!missingSkills.length} onClick={goLive}><Play size={16} /> Check setup & go live</button></div>}
    </section>}
    {assigned?.team?.length ? <div className="wa-roster" aria-label="Saathi specialists">{assigned.team.map((m) => <article key={m.id}><PixelTeammate id={memberCharacter(m)} /><div><strong>{m.name}</strong><small>{m.role}</small></div></article>)}</div> : null}
    <div className="wa-cloud-note"><Cloud size={16} /><span>Authorised work continues in the cloud while your browser is closed. Connection loss or an owner decision pauses the relevant work.</span></div>

    <div className="wa-conversation-layout">
      <section className="office-card wa-conversation-list"><div className="wa-section-title"><h3>Customers</h3><span>{sales.conversations.length}</span></div><label className="wa-search"><Search size={16} /><input aria-label="Search customers" placeholder="Name or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></label><label className="wa-stage-filter">Show<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All conversations</option>{Object.entries(stageLabels).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select></label>
        {!loaded && !readError ? <p role="status" className="wa-empty-text">Loading your conversations…</p> : !rows.length ? <div className="wa-empty-conversations"><MessageCircle size={25} /><strong>{sales.conversations.length ? "No matching customers" : "Your next enquiry starts here"}</strong><p>{sales.conversations.length ? "Try another search or stage." : "Once your connected team is live, new individual customer messages appear here. Existing history is not imported."}</p></div> : <div className="wa-customer-rows">{rows.map((c) => <button key={c.id} className={current?.id === c.id ? "selected" : ""} onClick={() => setSelected(c.id)}><span className="wa-customer-avatar">{c.customerName?.[0]?.toUpperCase() || <UserRound size={16} />}</span><div><strong>{c.customerName || "WhatsApp customer"}</strong><small>{c.history?.at(-1)?.text || c.reason || c.recipient}</small><Status value={c.stage}>{stageLabels[c.stage]}</Status></div>{c.mode === "owner" && <UserRound size={14} aria-label="Owner is speaking" />}</button>)}</div>}
      </section>
      <section className="office-card wa-conversation-detail">
        {!current ? <div className="wa-select-conversation"><MessageCircle size={34} /><h3>A customer’s whole journey, in one place.</h3><p>Select a conversation to see messages, accepted orders, payment evidence and upcoming follow-ups.</p></div> : <>
          <header className="wa-customer-header"><div><h3>{current.customerName || "WhatsApp customer"}</h3><small>{contactLabel(current.recipient)} · {stateLabel(current.language)}</small></div><Status value={current.stage}>{stageLabels[current.stage]}</Status></header>
          <div className={`wa-speaker ${current.mode === "owner" ? "owner" : ""}`}><span>{current.mode === "owner" ? <UserRound size={16} /> : <MessageCircle size={16} />}{current.mode === "owner" ? "You are handling this conversation. Automatic replies are stopped." : `${speakerName} is the speaking teammate. Specialists help internally.`}</span><button className="office-secondary" disabled={!!busy || current.optedOut && current.mode === "owner"} onClick={() => act(current.mode === "owner" ? "Resuming this conversation" : "Stopping automatic replies for this customer", () => api.whatsappConversationControl(token!,current.id,current.mode === "owner" ? "resume" : "takeover"))}>{current.mode === "owner" ? <><Play size={14} /> Resume teammate</> : <><Pause size={14} /> Take over</>}</button></div>
          {current.optedOut && <p className="wa-form-error">This customer opted out. Automatic follow-ups stay stopped.</p>}
          {current.reason && <div className="wa-owner-needed"><ShieldCheck size={17} /><p>{current.reason}</p></div>}
          <div className="wa-chat" ref={chat} aria-label="Customer conversation">{current.history?.length ? current.history.map((turn,i) => <article key={turn.outboxId || turn.providerId || `${turn.at}-${i}`} className={`wa-message wa-message-${turn.kind}`}><strong>{turn.kind === "customer" ? current.customerName || "Customer" : turn.kind === "owner" ? "You" : speakerName}</strong><p>{turn.text}</p><small>{when(turn.at)}{turn.kind !== "customer" && (turn.providerMessageId || turn.providerId) && <><Check size={11} /> WhatsApp receipt</>}</small></article>) : <p className="wa-empty-text">The next customer message appears here when it reaches the cloud session.</p>}</div>
          {queuedReplies.map((item) => <article className="wa-queued" key={item.id}><div><strong>{item.kind === "owner_reply" ? "Your approved reply" : "Teammate action"}</strong><Status value={item.state}>{item.state === "sending" ? "Sending · awaiting receipt" : "Queued in the cloud"}</Status></div><p>{item.message}</p><small>A provider receipt is needed before this appears as sent.</small></article>)}
          {pendingActions.map((item) => <div className="wa-uncertain" key={item.id}><strong>{item.state === "uncertain" ? "Sending outcome needs verification" : "Your help is needed"}</strong><p>{item.reason || "The provider has not confirmed this action. It is not shown as sent."}</p><details><summary>Review the intended message</summary><p>{item.message}</p></details></div>)}
          {current.mode === "owner" && <form className="wa-owner-reply" onSubmit={(e) => { e.preventDefault(); if (!reply.trim()) return; void act("Queuing your exact approved reply", async () => { if (replyAttempt.current?.conversationId !== current.id || replyAttempt.current.text !== reply) replyAttempt.current = { conversationId: current.id, text: reply, key: crypto.randomUUID() }; await api.whatsappOwnerReply(token!,current.id,reply,replyAttempt.current.key); replyAttempt.current = null; setReply(""); }); }}><label>Your exact reply<textarea rows={3} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply in your own words. The teammate remains paused for this customer." /></label><div><small>Sent from your connected WhatsApp. A receipt confirms sending.</small><button className="office-primary" disabled={!!busy || !connected || reply.trim().length < 1 || !!readError}><Send size={15} /> Send my reply</button></div></form>}
          <div className="wa-order-evidence"><h4>Orders & payment evidence</h4>{!selectedOrders.length ? <p>No accepted order yet. The team must use your approved prices and obtain customer acceptance first.</p> : selectedOrders.map((order) => {
            const payment = workspace.payments?.find((p) => p.bookingId === order.id);
            return <article key={order.id}><div className="wa-order-title"><strong>{order.name} × {order.quantity}</strong><span>{money(order.amountPaise)}</span></div><div className="wa-evidence-facts"><span>Quote <strong>{order.customerAcceptedAt ? "Customer accepted" : "Awaiting acceptance"}</strong></span><span>Payment <strong>{payment?.state === "paid" ? "Verified paid" : stateLabel(payment?.state || order.paymentState || "Not requested")}</strong></span><span>Fulfilment <strong>{stateLabel(payment?.fulfilment || "Not recorded")}</strong></span></div>
              {payment && <><Status value={payment.mode === "staging" ? "test" : "live"}>{payment.mode === "staging" ? "Paytm test payment" : "Paytm live payment"}</Status>{payment.txnId && payment.state === "paid" && <p className="wa-payment-proof"><ShieldCheck size={15} />Verified {when(payment.verifiedAt)} · Transaction {payment.txnId}</p>}<div className="office-actions">{payment.url && /^https:\/\//.test(payment.url) && payment.state !== "paid" && <a className="office-text" href={payment.url} target="_blank" rel="noreferrer">Open checkout <ArrowUpRight size={14} /></a>}<button className="office-text" disabled={!!busy || payment.state === "paid"} onClick={() => act("Verifying payment with Paytm", () => api.verifyPayment(token!,payment.id))}>Check with Paytm <RefreshCw size={13} /></button></div></>}
              {order.reason && <p className="wa-help">{order.reason}</p>}{order.kind === "appointment" && order.selectedSlot && <p className="wa-help">Appointment: {when(order.selectedSlot.start)} · {order.calendarVerified ? "Calendar verified" : "Calendar result pending verification"}</p>}
              <details><summary>Order evidence</summary><dl><dt>Order reference</dt><dd>{order.id}</dd>{payment && <><dt>Paytm order reference</dt><dd>{payment.orderId}</dd><dt>Currency & expected amount</dt><dd>{payment.currency} · {money(payment.amountPaise)}</dd></>}{order.customerAcceptedAt && <><dt>Customer accepted</dt><dd>{when(order.customerAcceptedAt)}</dd></>}</dl></details>
            </article>;
          })}</div>
          <div className="wa-upcoming"><h4><Clock3 size={16} /> Upcoming follow-ups</h4>{!followups.length ? <p>{current.stage === "paid" ? "Payment is verified. Pending payment reminders stop." : current.mode === "owner" ? "Automatic follow-ups are stopped while you handle this customer." : "No payment follow-ups are currently scheduled."}</p> : followups.map((item) => <article key={item.id}><div><strong>{when(item.notBefore)}</strong><Status value={item.state} /></div><p>{item.message}</p></article>)}</div>
        </>}
      </section>
    </div>
    {latestDigest && <section className="office-card wa-digest"><div><span className="office-eyebrow">YOUR DAILY OWNER SUMMARY</span><h3>{latestDigest.date}</h3><small>Prepared {when(latestDigest.preparedAt)} · in this workspace</small></div><div><span>Verified payments<strong>{latestDigest.verifiedPaymentCount}</strong></span><span>Verified collection<strong>{money(latestDigest.verifiedAmountPaise)}</strong></span><span>Awaiting payment<strong>{latestDigest.pendingPaymentOrderIds.length}</strong></span><span>Need your help<strong>{latestDigest.ownerNeededConversationIds.length}</strong></span></div></section>}
    <div className="wa-desk-footer"><CreditCard size={16} /><p>Only signed, server-verified Paytm results mark an order paid. A customer screenshot, callback or claimed payment is not payment evidence.</p></div>
  </section>;
}
