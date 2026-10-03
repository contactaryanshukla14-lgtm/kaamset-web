import {useLanguage} from './Language';
import {UiText} from './Language';
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
const {t:localize}=useLanguage();

  const defaults = (): WhatsAppSalesSetup => ({
    approved: true, blueprintId: current?.blueprintId || teams.at(-1)?.id || "",
    language: current?.language || "auto", tone: current?.tone || "friendly",
    replyOutsideQuietHours: current?current.replyOutsideQuietHours===true:true,
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
    <div className="wa-section-title"><div><span className="office-eyebrow"><UiText text={"ONLY THE RULES THIS JOB NEEDS"}/></span><h3><UiText text={"How should Aarav work for you?"}/></h3></div><Settings2 size={22} /></div>
    {serverChanged && <div className="wa-approval-summary" role="status"><div><strong><UiText text={"Your saved sales rules changed."}/></strong><p><UiText text={"Your edits are preserved. Reload the latest rules before approving another change."}/></p><button type="button" className="office-text" disabled={busy} onClick={reload}><UiText text={"Reload saved rules"}/></button></div></div>}
    <fieldset className="wa-rules-fields" disabled={busy}>
    <div className="office-form-row">
      <label><UiText text={"Which team?"}/><select value={draft.blueprintId} onChange={(e) => edited({ ...draft, blueprintId: e.target.value })} required>
        <option value=""><UiText text={teams.length ? "Choose a WhatsApp team" : "Set up your WhatsApp team first"}/></option>
        {teams.map((t) => <option value={t.id} key={t.id}>{teamName(t)} · {stateLabel(t.state)}</option>)}
      </select></label>
      <label><UiText text={"Replies in"}/><select value={draft.language} onChange={(e) => edited({ ...draft, language: e.target.value as WhatsAppSalesSetup["language"] })}>
        <option value="auto"><UiText text={"Customer’s language · English, Hindi or Hinglish"}/></option><option value="hinglish"><UiText text={"Hinglish"}/></option><option value="hi"><UiText text={"Hindi"}/></option><option value="en"><UiText text={"English"}/></option>
      </select></label>
      <label><UiText text={"Tone"}/><select value={draft.tone} onChange={(e) => edited({ ...draft, tone: e.target.value as WhatsAppSalesSetup["tone"] })}><option value="friendly"><UiText text={"Warm & friendly"}/></option><option value="professional"><UiText text={"Professional"}/></option></select></label>
      <label><UiText text={"Delivery / service area "}/><small><UiText text={"Optional"}/></small><input maxLength={200} value={draft.deliveryArea || ""} placeholder={localize("e.g. Pickup only, or Baner and Aundh")} onChange={(e) => edited({ ...draft, deliveryArea: e.target.value })} /></label>
    </div>
    <label><UiText text={"Discount requests above this limit need your help (%)"}/><input type="number" min={0} max={30} step={1} value={draft.discountLimitPercent} onChange={(e) => edited({ ...draft, discountLimitPercent: Number(e.target.value) })} /></label>
    <p className="wa-help"><UiText text={"Quoted amounts come from approved prices. This limit helps route discount requests; it does not authorise changing your prices."}/></p>
    {!validDiscount && <p className="wa-form-error" role="alert"><UiText text={"Use a whole-number discount limit from 0 to 30."}/></p>}
    <label><UiText text={"When should the team ask you?"}/><textarea rows={3} maxLength={800} value={ownerHelp} onChange={(e) => { dirty.current = true; setOwnerHelp(e.target.value); setApproved(false); }} /><small><UiText text={"Up to 4 rules, one per line. Keep each under 200 characters."}/></small></label>
    {!validHelp && <p className="wa-form-error" role="alert"><UiText text={"Use up to 4 owner-help rules, with 3–200 characters per line."}/></p>}
    {!validArea && <p className="wa-form-error" role="alert"><UiText text={"Describe the service area with at least 2 characters, or leave it empty for owner confirmation."}/></p>}
    <fieldset className="wa-rule-group"><legend><UiText text={"Unpaid payment reminders"}/></legend>
      <label className="office-check"><input type="checkbox" checked={draft.followup.enabled} onChange={(e) => edited({ ...draft, followup: { ...draft.followup, enabled: e.target.checked } })} /><span><UiText text={"Let Milan follow up on accepted, unpaid orders"}/></span></label>
      {draft.followup.enabled && <div className="wa-followup-options office-view-enter">
        <label><UiText text={"Minutes after the payment request"}/><input value={reminders} onChange={(e) => { dirty.current = true; setReminders(e.target.value); setApproved(false); }} placeholder={localize("e.g. 60, 1440")} inputMode="text" /><small><UiText text={"Up to 3 increasing times, 15 minutes to 7 days."}/></small></label>
        {!validReminders && <p className="wa-form-error" role="alert"><UiText text={"Use 1–3 increasing whole numbers, for example 60, 1440."}/></p>}
        <p className="wa-help"><UiText text={"Milan stops reminders after verified payment, customer opt-out or owner takeover."}/></p>
      </div>}
    </fieldset>
    <fieldset className="wa-rule-group"><legend><UiText text={"WhatsApp sending hours · India time"}/></legend><label className="office-check"><input type="checkbox" checked={draft.replyOutsideQuietHours===true} onChange={e=>edited({...draft,replyOutsideQuietHours:e.target.checked})}/><span><UiText text={"Answer customer enquiries 24×7, including during quiet hours"}/></span></label><div className="office-form-row">{(["quietStart", "quietEnd"] as const).map((key) => <label key={key}><UiText text={key === "quietStart" ? "Quiet hours begin" : "Resume scheduled sending at"}/><select value={draft.followup[key]} onChange={(e) => edited({ ...draft, followup: { ...draft.followup, [key]: Number(e.target.value) } })}>{Array.from({ length: 24 }, (_,h) => <option key={h} value={h}>{String(h).padStart(2,"0")}<UiText text={":00 IST"}/></option>)}</select></label>)}</div><p className="wa-help"><UiText text={"Payment reminders and scheduled messages wait during quiet hours. "}/><UiText text={draft.replyOutsideQuietHours?'Replies to customer enquiries can continue.':'Customer replies also wait.'}/>{draft.followup.quietStart === draft.followup.quietEnd && " Equal times mean no quiet period."}</p></fieldset>
    <div className="wa-summary-option"><label className="office-check"><input type="checkbox" checked={draft.summary.enabled} onChange={(e) => edited({ ...draft, summary: { ...draft.summary, enabled: e.target.checked } })} /><span><UiText text={"Prepare my daily summary in this workspace"}/></span></label>{draft.summary.enabled && <label><UiText text={"India time"}/><input type="time" value={draft.summary.at} required onChange={(e) => edited({ ...draft, summary: { ...draft.summary, at: e.target.value } })} /></label>}</div>
    <div className="wa-approval-summary"><ShieldCheck size={21} /><div><strong><UiText text={"Review the job before it goes live"}/></strong><p><UiText text={"Aarav handles enquiries from approved facts. Quotes and Paytm requests run only if those modules are configured and ready. "}/><UiText text={draft.followup.enabled ? "Milan follows your approved reminder schedule." : "No automatic payment reminders."}/> <UiText text={"Missing facts and commercial exceptions come to you. A payment is separate from fulfilment."}/></p></div></div>
    <label className="office-check"><input type="checkbox" checked={approved} disabled={serverChanged} onChange={(e) => setApproved(e.target.checked)} /><span><UiText text={"I approve these reply, payment and follow-up rules for my business."}/></span></label>
    </fieldset>
    <button className="office-primary" disabled={busy || serverChanged || !approved || !validTeam || !validReminders || !validHelp || !validArea || !validDiscount || !validSummary}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} <UiText text={"Save approved job rules"}/></button>
  </form>;
}

export default function WhatsAppSalesDesk({ token, workspace, onChange, onBuild, onBusiness, onTeam, paymentSettings }: {
  token: string | null; workspace: WorkspaceState; onChange: () => Promise<unknown>;
  onBuild: () => void; onBusiness: () => void; onTeam: (id: string) => void; paymentSettings: ReactNode;
}) {
const {t:localize}=useLanguage();

  const [wa, setWa] = useState<WhatsAppState | null>(null), [sales, setSales] = useState<WhatsAppSalesState>(workspace.whatsappSales || empty);
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [readError, setReadError] = useState(""), [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(""), [search, setSearch] = useState(""), [filter, setFilter] = useState("all"), [reply, setReply] = useState("");
  const [editing, setEditing] = useState(false), [liveConsent, setLiveConsent] = useState(false),[enquiryConsent,setEnquiryConsent]=useState(false),[enquiryAlwaysOn,setEnquiryAlwaysOn]=useState(true);
  const actionInFlight = useRef(false), chat = useRef<HTMLDivElement>(null);
  const readSequence = useRef(0), tokenRef = useRef(token);
  tokenRef.current = token;
  const replyAttempt = useRef<{ conversationId: string; text: string; key: string } | null>(null);
  const teams = workspace.blueprints.filter((b) => b.plan.skills.includes("whatsapp_enquiries"));
  const assigned = teams.find((b) => b.id === sales.settings?.blueprintId);
  const missingSkills = assigned&&sales.settings?.followup.enabled ? [
    ["paytm_request", "Request and verify Paytm payments"],["whatsapp_sales_followup", "Follow up on unpaid accepted orders"],
  ].filter(([skill]) => !assigned.plan.skills.includes(skill)).map(([,description]) => description) : [];
  const connected = wa?.state === "connected", enabled = !!wa?.salesAutoReplyEnabled;
  const hasPaytm = !!workspace.paymentSetup?.configured, hasOffers = !!workspace.commerce?.offers.length;
  const needsPaytm=!!assigned?.plan.skills.includes('paytm_request'),needsOffers=!!assigned?.plan.skills.includes('order_capture');
  const controlled = !!workspace.controls?.humanTakeover || !!workspace.controls?.paused;
  const running = enabled && connected && !controlled && assigned?.state === "active" && !!workspace.channels?.whatsapp?.enabled && !!workspace.channels.whatsapp.ready && !workspace.channels.whatsapp.error && (!workspace.channels.whatsapp.speakerBlueprintId||workspace.channels.whatsapp.speakerBlueprintId===assigned.id) && workspace.limits.modelsRemaining>0 && workspace.limits.toolsRemaining>0;
  const current = sales.conversations.find((c) => c.id === selected);
  const rows = sales.conversations.filter((c) => (filter === "all" || c.stage === filter) &&
    `${c.customerName} ${c.recipient}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  const selectedOrders = workspace.commerce?.orders.filter((o) => current?.orderIds.includes(o.id)) || [];
  const currentOutbox = sales.outbox.filter((o) => o.conversationId === current?.id);
  const followups = currentOutbox.filter((o) => o.kind === "payment_followup" && ["pending", "sending"].includes(o.state));
  const pendingActions = currentOutbox.filter((o) => ["uncertain", "owner_needed"].includes(o.state));
  const queuedReplies = currentOutbox.filter((o) => o.kind !== "payment_followup" && ["pending", "sending"].includes(o.state));
  const speaker = workspace.blueprints.find((b) => b.id === current?.speakerBlueprintId);
  const speakerName = speaker?.teamIdentity?.lead || "Aarav";
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
      await api.whatsappAction(token,"enable",{blueprintId:assigned.id,revision:assigned.revision});setLiveConsent(false);
    });
  }
  async function startEnquiries(){await act('Starting Aarav’s enquiry replies',async()=>{
    if(!token||!enquiryConsent)return;
    const old=workspace.blueprints.find(b=>b.presetId==='saathi'),team=await api.readyTeam(token,'saathi',{whatsapp:true},old?.revision),previous=sales.settings;
    await api.configureWhatsAppSales(token,{approved:true,blueprintId:team.id,language:previous?.language||'auto',tone:previous?.tone||'friendly',replyOutsideQuietHours:enquiryAlwaysOn,deliveryArea:previous?.deliveryArea||null,discountLimitPercent:0,ownerHelp:previous?.ownerHelp||['Complaints, refunds and cancellations','Missing stock, delivery facts or booking availability','Discounts and commercial exceptions'],followup:{enabled:false,afterMinutes:[],quietStart:previous?.followup.quietStart??22,quietEnd:previous?.followup.quietEnd??7},summary:{enabled:false,at:'19:00'}});
    await api.whatsappAction(token,'enable',{blueprintId:team.id,revision:team.revision});setEnquiryConsent(false);
  })}

  return <section className="wa-desk">
    <div className="office-heading wa-heading"><div><span className="office-eyebrow"><UiText text={"SALES CIRCLE · WHATSAPP"}/></span><h1><UiText text={"Customer enquiries, handled."}/></h1><p><UiText text={"Aarav replies from your business facts. Add quotes, bookings and payments when you need them."}/></p></div><PixelTeammate id="tara" name="Aarav" state={running ? "active" : "idle"} /></div>
    {(error || readError) && <div className="office-error" role="alert"><span>{error || `Could not refresh the desk. ${readError}`}</span><button aria-label={localize("Dismiss message")} onClick={() => { setError(""); setReadError(""); }}>×</button></div>}
    {busy && <div className="office-busy" role="status"><LoaderCircle size={16} className="spin" />{busy}</div>}
    <div className="wa-health">
      <div><span className={`wa-connection-icon ${connected ? "is-connected" : ""}`}>{connected ? <Wifi size={20} /> : <WifiOff size={20} />}</span><div><strong><UiText text={connected ? "WhatsApp connected" : pairing ? "Pair your account" : wa?.canReconnect ? "Reconnect required" : "Connect WhatsApp"}/></strong><small>{wa?.phone || (loaded ? "Your own isolated linked-device session" : "Checking your cloud session…")}</small></div></div>
      <div><Status value={running ? "active" : "paused"}><UiText text={running ? "Teammate is live" : "Automatic replies paused"}/></Status><button className="office-icon-button" aria-label={localize("Refresh WhatsApp desk")} disabled={!!busy} onClick={() => act("Refreshing your desk", read)}><RefreshCw size={16} /></button></div>
    </div>
    <div className="wa-journey" aria-label={localize("Customer journey")}>{["Enquiry", "Approved quote", "Customer accepts", "Paytm checkout", "Verified payment"].map((step,i) => <div key={step}><span>{String(i+1).padStart(2,"0")}</span>{step}{i < 4 && <ChevronRight size={15} />}</div>)}</div>

    {!running&&<section className="office-card wa-enquiry-launch"><span className="office-eyebrow"><UiText text={"START WITH THE JOB YOU NEED"}/></span><h2><UiText text={"Let Aarav answer your customer enquiries."}/></h2><p><UiText text={"Use your paired WhatsApp and approved business facts. No Paytm credentials, catalogue or calendar are needed for routine replies. Orders, payments and follow-ups stay off in this starter job."}/></p><label className="office-check"><input type="checkbox" checked={enquiryAlwaysOn} onChange={e=>{setEnquiryAlwaysOn(e.target.checked);setEnquiryConsent(false)}}/><span><UiText text={"Answer incoming customer enquiries 24×7. Scheduled reminders still respect quiet hours."}/></span></label><label className="office-check"><input type="checkbox" checked={enquiryConsent} onChange={e=>setEnquiryConsent(e.target.checked)}/><span><UiText text={"I approve Aarav’s enquiry-only job. Use my approved facts; ask me about discounts, complaints, uncertain stock or bookings."}/></span></label><button className="office-primary" disabled={!!busy||!connected||controlled||!workspace.briefApproved||!enquiryConsent||!!readError} onClick={()=>void startEnquiries()}><Play size={16}/><UiText text={"Start enquiry replies"}/></button>{!connected&&<small><UiText text={"Pair your WhatsApp below first. No payment account is required."}/></small>}</section>}
    <details className="office-card wa-setup" open={!connected || editing} onToggle={(e) => { if (!e.currentTarget.open) setEditing(false); }}>
      <summary><div><Settings2 size={19} /><strong><UiText text={sales.settings && connected && hasPaytm && hasOffers ? "Your setup & approved rules" : "Let’s get your sales team ready"}/></strong></div><span><UiText text={"3 simple steps "}/><ChevronRight size={16} /></span></summary>
      <div className="wa-setup-body">
        <div className="wa-setup-steps">
          <article><span className={`wa-step-number ${workspace.briefApproved && hasOffers ? "done" : ""}`}>{workspace.briefApproved && hasOffers ? <Check size={16} /> : "1"}</span><h3><UiText text={"Tell us your business"}/></h3><p>{hasOffers ? `${workspace.commerce!.offers.length} approved offers. Review stock, prices and business hours.` : "Add your products or services, approved prices, stock and hours."}</p><button className="office-text" onClick={onBusiness}><UiText text={"Edit business facts "}/><ArrowRight size={14} /></button></article>
          <article><span className={`wa-step-number ${connected ? "done" : ""}`}>{connected ? <Check size={16} /> : "2"}</span><h3><UiText text={"Pair WhatsApp"}/></h3><p><UiText text={"Scan WhatsApp’s QR to start enquiries. Paytm is optional unless you enable payment requests."}/></p><Status value={hasPaytm ? "connected" : "optional"}>{hasPaytm ? `Paytm ${workspace.paymentSetup?.mode === "production" ? "live mode" : "test mode"}` : "Payments · add when needed"}</Status></article>
          <article><span className={`wa-step-number ${sales.settings && assigned?.state === "active" && enabled ? "done" : ""}`}>{sales.settings && assigned?.state === "active" && enabled ? <Check size={16} /> : "3"}</span><h3><UiText text={"Approve & go live"}/></h3><p><UiText text={"Review who replies, when to follow up and when the team asks you."}/></p>{!teams.length ? <button className="office-text" onClick={onBuild}><UiText text={"Set up Aarav "}/><ArrowRight size={14} /></button> : <button className="office-text" onClick={() => onTeam(assigned?.id || teams.at(-1)!.id)}><UiText text={"Review my team "}/><ArrowRight size={14} /></button>}</article>
        </div>
        <section className="wa-pairing">
          <div><span className="office-eyebrow"><UiText text={"WHATSAPP · YOUR CLOUD SESSION"}/></span><h3><UiText text={connected ? "Your account is paired." : pairing ? "Scan to pair your business number." : "Bring your WhatsApp conversations here."}/></h3><p><UiText text={"On your phone, open WhatsApp → Settings → Linked devices → Link a device. Only scan this QR for your own account."}/></p>{pairingError && <p className="wa-form-error">{pairingError}</p>}
            {!connected && <p className="wa-help"><UiText text={wa?.canReconnect ? "Your cloud session lost its connection. Reconnect here; saved conversations and orders stay in your workspace." : "KaamSet runs the linked session in the cloud. Your computer can be off while that session stays connected."}/></p>}
            {loaded && wa && !wa.linked && !wa.canLink && !wa.canReconnect && !wa.error && <p className="wa-form-error"><UiText text={"Cloud pairing is unavailable for this workspace. Your setup stays saved; the connection must be enabled before the team can reply."}/></p>}
            <div className="office-actions">{wa?.canLink && <button className="office-primary" disabled={!!busy} onClick={() => act("Preparing your pairing QR", () => api.whatsappAction(token!,"link"))}><UiText text={"Show pairing QR "}/><MessageCircle size={16} /></button>}{wa?.canReconnect && <button className="office-primary" disabled={!!busy} onClick={() => act("Reconnecting your cloud WhatsApp session", () => api.whatsappAction(token!,"reconnect"))}><UiText text={"Reconnect "}/><RefreshCw size={16} /></button>}{wa?.linked && <button className="office-text" disabled={!!busy} onClick={() => act("Unlinking this WhatsApp device", () => api.whatsappAction(token!,"unlink"))}><UiText text={"Unlink device"}/></button>}</div>
            <small><UiText text={"Uses the existing WhatsApp Web linked-device adapter. Your account remains subject to WhatsApp’s linked-device requirements."}/></small>
          </div>{showPairingQr && <div className="wa-qr"><QRCodeSVG value={wa!.qr!} size={196} marginSize={4} /><span><UiText text={"Scan in WhatsApp · Linked devices"}/></span></div>}{pairing && !showPairingQr && <div className="wa-qr-pending" role="status"><LoaderCircle size={28} className="spin" /><p><UiText text={wa.state === "pairing" ? "Finishing your connection…" : "Preparing your QR…"}/></p></div>}
        </section>
        {paymentSettings}
        {!loaded ? <p role="status"><UiText text={"Loading your saved sales rules…"}/></p> : teams.length ? <SalesRules teams={teams} current={sales.settings} busy={!!busy} onSave={(settings) => act("Saving your approved sales rules", () => api.configureWhatsAppSales(token!, settings))} /> : <div className="wa-build-first"><PixelTeammate id="tara" /><div><h3><UiText text={"Meet Aarav’s customer team."}/></h3><p><UiText text={"Enable WhatsApp on your ready customer team. Add the live sales modules you want, then review permissions and activate."}/></p><button className="office-primary" onClick={onBuild}><UiText text={"Set up Aarav’s WhatsApp team "}/><ArrowRight size={16} /></button></div></div>}
      </div>
    </details>

    {!!sales.settings && <section className="office-card wa-live-control">
      <div><strong>{assigned ? teamName(assigned) : "Select a WhatsApp team"}</strong><p><UiText text={running ? "Routine replies follow your approved business facts and rules." : "Your rules are saved. Complete the setup, then start your team."}/></p>{controlled && <p className="wa-form-error"><UiText text={"Your whole office is paused or in owner takeover. Resume it from the top bar first."}/></p>}{!!missingSkills.length && <div className="wa-form-error"><p><UiText text={"This team still needs these jobs before it can handle the full sale:"}/></p><ul>{missingSkills.map((s) => <li key={s}>{s}</li>)}</ul><button className="office-text" onClick={onBuild}><UiText text={"Configure Aarav’s live modules "}/><ArrowRight size={14} /></button></div>}</div>
      {running ? <button className="office-secondary" disabled={!!busy} onClick={() => act("Pausing WhatsApp automation", () => api.whatsappAction(token!,"disable"))}><Pause size={16} /> <UiText text={"Pause WhatsApp"}/></button> : <div><label className="office-check"><input type="checkbox" checked={liveConsent} onChange={(e) => setLiveConsent(e.target.checked)} /><span><UiText text={"Let this team handle new eligible customer messages using my approved rules."}/></span></label><button className="office-primary" disabled={!!busy || !assigned || !connected || needsPaytm&&!hasPaytm || needsOffers&&!hasOffers || !liveConsent || controlled || !!readError || !!missingSkills.length} onClick={goLive}><Play size={16} /> <UiText text={"Check setup & go live"}/></button></div>}
    </section>}
    {assigned?.team?.length ? <div className="wa-roster" aria-label={localize("Saathi specialists")}>{assigned.team.map((m) => <article key={m.id}><PixelTeammate id={memberCharacter(m)} /><div><strong>{m.name}</strong><small>{m.role}</small></div></article>)}</div> : null}
    <div className="wa-cloud-note"><Cloud size={16} /><span><UiText text={"Authorised work continues in the cloud while your browser is closed. Connection loss or an owner decision pauses the relevant work."}/></span></div>

    <div className="wa-conversation-layout">
      <section className="office-card wa-conversation-list"><div className="wa-section-title"><h3><UiText text={"Customers"}/></h3><span>{sales.conversations.length}</span></div><label className="wa-search"><Search size={16} /><input aria-label={localize("Search customers")} placeholder={localize("Name or phone")} value={search} onChange={(e) => setSearch(e.target.value)} /></label><label className="wa-stage-filter"><UiText text={"Show"}/><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all"><UiText text={"All conversations"}/></option>{Object.entries(stageLabels).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select></label>
        {!loaded && !readError ? <p role="status" className="wa-empty-text"><UiText text={"Loading your conversations…"}/></p> : !rows.length ? <div className="wa-empty-conversations"><MessageCircle size={25} /><strong><UiText text={sales.conversations.length ? "No matching customers" : "Your next enquiry starts here"}/></strong><p><UiText text={sales.conversations.length ? "Try another search or stage." : "Once your connected team is live, new individual customer messages appear here. Existing history is not imported."}/></p></div> : <div className="wa-customer-rows">{rows.map((c) => <button key={c.id} className={current?.id === c.id ? "selected" : ""} onClick={() => setSelected(c.id)}><span className="wa-customer-avatar">{c.customerName?.[0]?.toUpperCase() || <UserRound size={16} />}</span><div><strong>{c.customerName || "WhatsApp customer"}</strong><small>{c.history?.at(-1)?.text || c.reason || c.recipient}</small><Status value={c.stage}>{stageLabels[c.stage]}</Status></div>{c.mode === "owner" && <UserRound size={14} aria-label={localize("Owner is speaking")} />}</button>)}</div>}
      </section>
      <section className="office-card wa-conversation-detail">
        {!current ? <div className="wa-select-conversation"><MessageCircle size={34} /><h3><UiText text={"A customer’s whole journey, in one place."}/></h3><p><UiText text={"Select a conversation to see messages, accepted orders, payment evidence and upcoming follow-ups."}/></p></div> : <>
          <header className="wa-customer-header"><div><h3>{current.customerName || "WhatsApp customer"}</h3><small>{contactLabel(current.recipient)} · {stateLabel(current.language)}</small></div><Status value={current.stage}>{stageLabels[current.stage]}</Status></header>
          <div className={`wa-speaker ${current.mode === "owner" ? "owner" : ""}`}><span>{current.mode === "owner" ? <UserRound size={16} /> : <MessageCircle size={16} />}{current.mode === "owner" ? "You are handling this conversation. Automatic replies are stopped." : `${speakerName} is the speaking teammate. Specialists help internally.`}</span><button className="office-secondary" disabled={!!busy || current.optedOut && current.mode === "owner"} onClick={() => act(current.mode === "owner" ? "Resuming this conversation" : "Stopping automatic replies for this customer", () => api.whatsappConversationControl(token!,current.id,current.mode === "owner" ? "resume" : "takeover"))}>{current.mode === "owner" ? <><Play size={14} /> <UiText text={"Resume teammate"}/></> : <><Pause size={14} /> <UiText text={"Take over"}/></>}</button></div>
          {current.optedOut && <p className="wa-form-error"><UiText text={"This customer opted out. Automatic follow-ups stay stopped."}/></p>}
          {current.reason && <div className="wa-owner-needed"><ShieldCheck size={17} /><p>{current.reason}</p></div>}
          <div className="wa-chat" ref={chat} aria-label={localize("Customer conversation")}>{current.history?.length ? current.history.map((turn,i) => <article key={turn.outboxId || turn.providerId || `${turn.at}-${i}`} className={`wa-message wa-message-${turn.kind}`}><strong>{turn.kind === "customer" ? current.customerName || "Customer" : turn.kind === "owner" ? "You" : speakerName}</strong><p>{turn.text}</p><small>{when(turn.at)}{turn.kind !== "customer" && (turn.providerMessageId || turn.providerId) && <><Check size={11} /> <UiText text={"WhatsApp receipt"}/></>}</small></article>) : <p className="wa-empty-text"><UiText text={"The next customer message appears here when it reaches the cloud session."}/></p>}</div>
          {queuedReplies.map((item) => <article className="wa-queued" key={item.id}><div><strong><UiText text={item.kind === "owner_reply" ? "Your approved reply" : "Teammate action"}/></strong><Status value={item.state}><UiText text={item.state === "sending" ? "Sending · awaiting receipt" : "Queued in the cloud"}/></Status></div><p>{item.message}</p><small><UiText text={"A provider receipt is needed before this appears as sent."}/></small></article>)}
          {pendingActions.map((item) => <div className="wa-uncertain" key={item.id}><strong><UiText text={item.state === "uncertain" ? "Sending outcome needs verification" : "Your help is needed"}/></strong><p>{item.reason || "The provider has not confirmed this action. It is not shown as sent."}</p><details><summary><UiText text={"Review the intended message"}/></summary><p>{item.message}</p></details></div>)}
          {current.mode === "owner" && <form className="wa-owner-reply" onSubmit={(e) => { e.preventDefault(); if (!reply.trim()) return; void act("Queuing your exact approved reply", async () => { if (replyAttempt.current?.conversationId !== current.id || replyAttempt.current.text !== reply) replyAttempt.current = { conversationId: current.id, text: reply, key: crypto.randomUUID() }; await api.whatsappOwnerReply(token!,current.id,reply,replyAttempt.current.key); replyAttempt.current = null; setReply(""); }); }}><label><UiText text={"Your exact reply"}/><textarea rows={3} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={localize("Reply in your own words. The teammate remains paused for this customer.")} /></label><div><small><UiText text={"Sent from your connected WhatsApp. A receipt confirms sending."}/></small><button className="office-primary" disabled={!!busy || !connected || reply.trim().length < 1 || !!readError}><Send size={15} /> <UiText text={"Send my reply"}/></button></div></form>}
          <div className="wa-order-evidence"><h4><UiText text={"Orders & payment evidence"}/></h4>{!selectedOrders.length ? <p><UiText text={"No accepted order yet. The team must use your approved prices and obtain customer acceptance first."}/></p> : selectedOrders.map((order) => {
            const payment = workspace.payments?.find((p) => p.bookingId === order.id);
            return <article key={order.id}><div className="wa-order-title"><strong>{order.name} × {order.quantity}</strong><span>{money(order.amountPaise)}</span></div><div className="wa-evidence-facts"><span><UiText text={"Quote "}/><strong><UiText text={order.customerAcceptedAt ? "Customer accepted" : "Awaiting acceptance"}/></strong></span><span><UiText text={"Payment "}/><strong>{payment?.state === "paid" ? "Verified paid" : stateLabel(payment?.state || order.paymentState || "Not requested")}</strong></span><span><UiText text={"Fulfilment "}/><strong>{stateLabel(payment?.fulfilment || "Not recorded")}</strong></span></div>
              {payment && <><Status value={payment.mode === "staging" ? "test" : "live"}><UiText text={payment.mode === "staging" ? "Paytm test payment" : "Paytm live payment"}/></Status>{payment.txnId && payment.state === "paid" && <p className="wa-payment-proof"><ShieldCheck size={15} /><UiText text={"Verified "}/>{when(payment.verifiedAt)} <UiText text={"· Transaction "}/>{payment.txnId}</p>}<div className="office-actions">{payment.url && /^https:\/\//.test(payment.url) && payment.state !== "paid" && <a className="office-text" href={payment.url} target="_blank" rel="noreferrer"><UiText text={"Open checkout "}/><ArrowUpRight size={14} /></a>}<button className="office-text" disabled={!!busy || payment.state === "paid"} onClick={() => act("Verifying payment with Paytm", () => api.verifyPayment(token!,payment.id))}><UiText text={"Check with Paytm "}/><RefreshCw size={13} /></button></div></>}
              {order.reason && <p className="wa-help">{order.reason}</p>}{order.kind === "appointment" && order.selectedSlot && <p className="wa-help"><UiText text={"Appointment: "}/>{when(order.selectedSlot.start)} · <UiText text={order.calendarVerified ? "Calendar verified" : "Calendar result pending verification"}/></p>}
              <details><summary><UiText text={"Order evidence"}/></summary><dl><dt><UiText text={"Order reference"}/></dt><dd>{order.id}</dd>{payment && <><dt><UiText text={"Paytm order reference"}/></dt><dd>{payment.orderId}</dd><dt><UiText text={"Currency & expected amount"}/></dt><dd>{payment.currency} · {money(payment.amountPaise)}</dd></>}{order.customerAcceptedAt && <><dt><UiText text={"Customer accepted"}/></dt><dd>{when(order.customerAcceptedAt)}</dd></>}</dl></details>
            </article>;
          })}</div>
          <div className="wa-upcoming"><h4><Clock3 size={16} /> <UiText text={"Upcoming follow-ups"}/></h4>{!followups.length ? <p><UiText text={current.stage === "paid" ? "Payment is verified. Pending payment reminders stop." : current.mode === "owner" ? "Automatic follow-ups are stopped while you handle this customer." : "No payment follow-ups are currently scheduled."}/></p> : followups.map((item) => <article key={item.id}><div><strong>{when(item.notBefore)}</strong><Status value={item.state} /></div><p>{item.message}</p></article>)}</div>
        </>}
      </section>
    </div>
    {latestDigest && <section className="office-card wa-digest"><div><span className="office-eyebrow"><UiText text={"YOUR DAILY OWNER SUMMARY"}/></span><h3>{latestDigest.date}</h3><small><UiText text={"Prepared "}/>{when(latestDigest.preparedAt)} <UiText text={"· in this workspace"}/></small></div><div><span><UiText text={"Verified payments"}/><strong>{latestDigest.verifiedPaymentCount}</strong></span><span><UiText text={"Verified collection"}/><strong>{money(latestDigest.verifiedAmountPaise)}</strong></span><span><UiText text={"Awaiting payment"}/><strong>{latestDigest.pendingPaymentOrderIds.length}</strong></span><span><UiText text={"Need your help"}/><strong>{latestDigest.ownerNeededConversationIds.length}</strong></span></div></section>}
    <div className="wa-desk-footer"><CreditCard size={16} /><p><UiText text={"Only signed, server-verified Paytm results mark an order paid. A customer screenshot, callback or claimed payment is not payment evidence."}/></p></div>
  </section>;
}
