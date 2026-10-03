import {UiText} from './Language';
import {useRef,useState} from 'react';
import {ArrowRight,Check,MessageCircle,Pause,ShieldCheck} from 'lucide-react';
import {api,type WorkspaceState} from './api';

const channels=[
 {id:'instagram_dm',name:'Instagram DMs',lead:'Riya',preset:'rang',option:'messages',skill:'instagram_dm',detail:'Riya answers new eligible customer DMs from approved business facts. Meta’s messaging permissions and reply window apply.',toolkit:'instagram'},
 {id:'instagram_comments',name:'Instagram comments',lead:'Riya',preset:'rang',option:'comments',skill:'instagram_comments',detail:'Riya checks new comments on your four most recent account posts, including posts made outside KaamSet.',toolkit:'instagram'},
 {id:'gmail',name:'Gmail sales desk',lead:'Meera',preset:'raabta',option:'inbox',skill:'gmail_sales',detail:'Meera answers new eligible inbox enquiries in their original customer thread.',toolkit:'gmail'},
];
export default function InboxPanel({token,workspace,onChange,onConnect,onWhatsApp}:{token:string|null;workspace:WorkspaceState|null;onChange:()=>Promise<unknown>;onConnect?:()=>void;onWhatsApp?:()=>void}){
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[consent,setConsent]=useState<Record<string,boolean>>({}),[drafts,setDrafts]=useState<Record<string,string>>({});
 const inFlight=useRef(false);
 async function act(label:string,fn:()=>Promise<unknown>){if(inFlight.current)return;inFlight.current=true;setBusy(label);setError('');setNotice('');try{await fn();await onChange()}catch(e){setError((e as Error).message);await onChange().catch(()=>{})}finally{setBusy('');inFlight.current=false}}
 async function start(c:typeof channels[number]){
  if(!token||!workspace||!consent[c.id])return;
  const old=workspace.blueprints.find(b=>b.presetId===c.preset);
  await api.startChannel(token,c.id,old?.revision);
  setConsent(previous=>({...previous,[c.id]:false}));setNotice(`${c.lead} is handling new eligible ${c.name.toLowerCase()}. Cloud account checks run about once a minute.`);
 }
 const controlled=!!workspace?.controls?.paused||!!workspace?.controls?.humanTakeover;
 return <section className="inbox-panel"><span className="card-kicker"><UiText text={"YOUR CLOUD CUSTOMER DESK"}/></span><h2><UiText text={"Connect. Approve. Your teammate replies."}/></h2><p><UiText text={"Instagram and email replies can start without Paytm, a product catalogue or a booking calendar. Enable quotes, payments and bookings separately when you need them."}/></p>
 {error&&<div className="workspace-error" role="alert">{error}</div>}{notice&&<p className="office-notice" role="status">{notice}</p>}{busy&&<p role="status">{busy}</p>}
 {controlled&&<p className="office-notice"><UiText text={"Your office is paused or in owner takeover. Resume it from the top bar before starting automatic replies."}/></p>}
 <div className="inbox-setup">{channels.map(c=>{
  const state=workspace?.channels?.[c.id],connected=workspace?.connections.some(x=>x.toolkit===c.toolkit&&x.status==='connected');
  const speaker=workspace?.blueprints.find(b=>state?.speakerBlueprintId?b.id===state.speakerBlueprintId:b.state==='active'&&b.plan.skills.includes(c.skill));
  const live=!!connected&&!!state?.enabled&&!!state.ready&&!state.error&&!!speaker&&speaker.state==='active'&&speaker.plan.skills.includes(c.skill)&&!controlled&&(workspace?.limits?.modelsRemaining??0)>0&&(workspace?.limits?.toolsRemaining??0)>0;
  return <article key={c.id}><MessageCircle size={20}/><h3>{c.name}</h3><p>{c.detail}</p><div className={`channel-runtime ${live?'is-live':''}`} role="status"><strong>{live?`${c.lead} is live`:state?.enabled?'Replies need attention':connected?'Account connected · teammate needs setup':'Account connection needed'}</strong>{state?.lastScanAt&&<small><UiText text={"Last cloud check: "}/>{new Date(state.lastScanAt).toLocaleTimeString('en-IN')}</small>}</div>{state?.error&&<p className="channel-error">{state.error}</p>}
   {!connected&&<>{onConnect&&<button className="button button-dark" disabled={!!busy} onClick={onConnect}><UiText text={"Connect "}/><UiText text={c.toolkit==='gmail'?'Gmail':'Instagram'}/> <ArrowRight size={15}/></button>}<small><UiText text={"Use your own connected account. Instagram requires a Business or Creator account."}/></small></>}
   {connected&&!live&&<><label className="approval-checkbox"><input type="checkbox" checked={!!consent[c.id]} onChange={e=>setConsent({...consent,[c.id]:e.target.checked})}/><span><UiText text={"I approve "}/>{c.lead} <UiText text={"replying to new customer enquiries using my approved facts. Discounts, complaints, uncertain stock and unsupported actions come to me."}/></span></label><button className="button button-dark" disabled={!!busy||!token||!consent[c.id]||controlled||!workspace?.briefApproved} onClick={()=>void act(`Checking access and starting ${c.lead}`,()=>start(c))}><Check size={15}/><UiText text={"Start "}/>{c.lead} <UiText text={"replies"}/></button><small><UiText text={"This starts a ready reply job and checks account access before activation. Extra sales modules can be configured later."}/></small></>}
   {state?.enabled&&<button className="text-button" disabled={!!busy||!token} onClick={()=>void act('Pausing channel replies',()=>api.channel(token!,c.id,false))}><Pause size={15}/><UiText text={"Pause channel"}/></button>}
   {live&&<p className="small-muted"><UiText text={"Send a new enquiry from another account to this connected business. Eligible messages appear below; exceptions need your review."}/></p>}
  </article>;
 })}</div>
 <div className="setup-box"><MessageCircle size={19}/><strong><UiText text={"Aarav’s WhatsApp team"}/></strong><p><UiText text={"Pair your business number and start enquiry replies. Paytm and order modules are optional."}/></p>{onWhatsApp&&<button className="text-button" onClick={onWhatsApp}><UiText text={"Open WhatsApp desk "}/><ArrowRight size={15}/></button>}</div>
 <div className="setup-box"><ShieldCheck size={17}/><strong><UiText text={"You can take over at any time"}/></strong><p><UiText text={"Owner takeover and channel pause stop automatic replies. Unconfirmed sends stay visible and are not retried automatically."}/></p></div>
 <div className="inbox-results"><h3><UiText text={"Enquiries and handoffs"}/></h3>{!workspace?.inbox?.length?<p><UiText text={"New messages after approval appear here. Connecting an account alone does not turn on automatic replies."}/></p>:workspace.inbox.slice().reverse().map(i=><article key={i.id}><div className="task-result-head"><span className="readiness-pill">{i.channel.replaceAll('_',' ')} · {i.state.replaceAll('_',' ')}</span><small>{new Date(i.createdAt).toLocaleString('en-IN')}</small></div><h4><UiText text={"Customer enquiry"}/></h4><p className="result-prose">{i.text}</p>{i.reply&&<><h4><UiText text={"Teammate response"}/></h4><p className="result-prose">{i.reply}</p></>}{i.reason&&<p>{i.reason}</p>}{i.state==='human_review'&&<div><label><UiText text={"Exact owner-approved reply"}/><textarea rows={4} maxLength={2000} value={drafts[i.id]??i.reply??''} onChange={e=>setDrafts({...drafts,[i.id]:e.target.value})}/></label><button className="button button-dark" disabled={!!busy||!token||!(drafts[i.id]??i.reply??'').trim()} onClick={()=>void act('Queuing your exact approved reply',()=>api.approveInboxReply(token!,i.id,drafts[i.id]??i.reply??''))}><UiText text={"Approve this reply and send"}/></button><p className="small-muted"><UiText text={"Review every fact. Release owner takeover before approved cloud sending."}/></p></div>}{i.providerReplyId&&<details><summary><UiText text={"Delivery evidence"}/></summary><code>{i.providerReplyId}<br/>{i.logRef}</code></details>}</article>)}</div>
 </section>;
}
