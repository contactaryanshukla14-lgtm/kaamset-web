import {useLanguage} from './Language';
import {UiText} from './Language';
import {useRef,useState} from 'react';
import {ArrowRight,Brain,Check,FileText,Link2,LoaderCircle,ShieldCheck,Sparkles,Users} from 'lucide-react';
import {api,type WorkspaceState} from './api';
import RecordDocuments from './RecordDocuments';
import {readyTeams,teamLead,teamRole,type ReadyTeamId} from './ReadyTeams';
import PixelTeammate from './PixelTeammate';
import './business-start.css';
const runNames={queued:'Queued',working:'Working',completed:'Ready',failed:'Didn’t finish',waiting_owner:'Needs you'} as const;
export default function BusinessStart({token,workspace,onChange,onChoose,onOpenTask}:{token:string;workspace:WorkspaceState;onChange:()=>Promise<unknown>;onChoose:(id:ReadyTeamId)=>void;onOpenTask:(id:string)=>void}){
const {t:localize}=useLanguage();

 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[node,setNode]=useState('brain');
 const locked=useRef(false),guide=workspace.businessGuide;
 const run=workspace.businessGuideRun,guideWorking=!!run&&['queued','working'].includes(run.state);
 const [answers,setAnswers]=useState<Record<string,string>>({}),[answersApproved,setAnswersApproved]=useState(false);
 const ownerHold=!!workspace.controls?.paused||!!workspace.controls?.humanTakeover;
 async function act(label:string,fn:()=>Promise<void>){if(locked.current)return;locked.current=true;setBusy(label);setError('');setNotice('');try{await fn();await onChange()}catch(e){setError((e as Error).message)}finally{setBusy('');locked.current=false}}
 async function saveAnswers(){if(!guide||!answersApproved)return;await act('Saving your approved answers',async()=>{const extra=guide.questions.filter(q=>answers[q]?.trim()).map(q=>`${q}\n${answers[q].trim()}`).join('\n\n');if(!extra)return;await api.saveBrief(token,workspace.brief+'\n\n[Owner-approved setup answers]\n'+extra,true);setAnswers({});setAnswersApproved(false);setNotice('Your answers are saved for every team. Teams using these facts are paused for your review: open My AI team to check and reactivate them. Then ask Sia for an updated guide.');});}
 const imports=workspace.recordImports||[];
 const practiceRows=imports.filter(i=>i.kind==='practice').reduce((n,x)=>n+x.rowCount,0),reportedRows=imports.filter(i=>i.kind!=='practice').reduce((n,x)=>n+x.rowCount,0);
 const activeTeams=workspace.blueprints.filter(b=>b.state==='active').length,connected=workspace.connections.filter(c=>c.status==='connected').length+(workspace.whatsappLinked?1:0);
 const nodes=[
  {id:'facts',group:'source',label:'Your business description',detail:workspace.briefApproved?'Approved by you':'Waiting for your approval',tone:workspace.briefApproved?'ok':'attention',Icon:FileText},
  {id:'records',group:'source',label:'Imported records',detail:imports.length?[reportedRows&&`${reportedRows} private entries`,practiceRows&&`${practiceRows} practice entries`].filter(Boolean).join(', '):'No files yet',tone:imports.length?'ok':'empty',Icon:FileText},
  {id:'rules',group:'source',label:'When to ask you',detail:workspace.business?.rules?'Your rules saved':'Default rules',tone:'ok',Icon:ShieldCheck},
  {id:'brain',group:'memory',label:'Shared memory',detail:workspace.briefApproved?'Ready for your teams':'Approve your description first',tone:workspace.briefApproved?'ok':'attention',Icon:Brain},
  {id:'teams',group:'use',label:'Your teams',detail:activeTeams?`${activeTeams} active`:'None active yet',tone:activeTeams?'ok':'empty',Icon:Users},
  {id:'apps',group:'use',label:'Connected accounts',detail:connected?`${connected} connected`:'None connected',tone:connected?'ok':'empty',Icon:Link2},
 ] as const;
 const nodeButton=(n:typeof nodes[number])=><button type="button" key={n.id} className={`memory-node memory-node-${n.id} tone-${n.tone} ${node===n.id?'selected':''}`} aria-pressed={node===n.id} onClick={()=>setNode(n.id)}><n.Icon size={18} aria-hidden="true"/><span><strong>{n.label}</strong><small><i aria-hidden="true"/>{n.detail}</small></span></button>;
 const guideState=guideWorking?run!.state:run&&['failed','waiting_owner'].includes(run.state)?run.state:guide?'completed':null;
 const startDisabledReason=!workspace.briefApproved?'Approve your business description first (see “Edit your business description” below).':ownerHold?'Your workspace is paused for owner control. Resume your team from the top bar to start new work.':'';
 return <div className="business-start">{error&&<p className="office-error" role="alert">{error}</p>}{notice&&<p className="office-notice" role="status">{notice}</p>}{busy&&<p className="business-start-progress" role="status"><LoaderCircle size={18} className="spin"/>{busy}</p>}

 <section className="office-card business-guide" aria-labelledby="sia-guide-title">
  <div className="business-guide-head"><PixelTeammate id="chotu" name="Sia" state={busy.includes('Sia')||guideWorking?'working':'idle'}/><div><h2 id="sia-guide-title"><UiText text={"Sia’s setup guide"}/></h2><p><UiText text={"Sia reads the description you wrote, suggests which ready teams fit, and asks only for details that are missing."}/></p></div>{guideState&&<span className={`office-status status-${guideState}`}><i aria-hidden="true"/>{runNames[guideState as keyof typeof runNames]}</span>}</div>
  {run?.reason&&(!guide||['failed','waiting_owner'].includes(run.state))&&<p className="office-notice" role="status">{run.reason}</p>}
  {guide?<>
   <p className="business-guide-summary">{guide.summary}</p>
   {!!guide.recommendedTeams.length&&<><h3><UiText text={"Teams Sia suggests"}/></h3><div className="business-recommendations">{guide.recommendedTeams.map(r=>{const t=readyTeams.find(x=>x.code===r.id);return t&&<button type="button" key={r.id} disabled={!!busy} onClick={()=>onChoose(t.code)}><span className="ready-card-portrait" aria-hidden="true"><PixelTeammate id={t.id} name={teamLead(t)}/></span><span><strong>{teamLead(t)} <em>{teamRole(t)}</em></strong><small>{r.reason}</small></span><ArrowRight size={16} aria-hidden="true"/></button>})}</div></>}
   {!!guide.questions.length&&<div className="business-guide-questions"><h3><UiText text={"A few answers will make your teams more useful"}/></h3><p><UiText text={"Answer what you know. Skip the rest; your teams will ask before acting on a missing fact."}/></p><div className="business-question-fields">{guide.questions.map(q=><label key={q}>{q}<input value={answers[q]||''} maxLength={500} disabled={!!busy} placeholder={localize("A short answer is enough")} onChange={e=>{setAnswers({...answers,[q]:e.target.value});setAnswersApproved(false)}}/></label>)}</div><label className="office-check"><input type="checkbox" checked={answersApproved} disabled={!!busy} onChange={e=>setAnswersApproved(e.target.checked)}/><span><UiText text={"These answers are correct. My teams may use them as business facts. Saving pauses active teams until I review them."}/></span></label><button type="button" className="office-primary" disabled={!!busy||!answersApproved||!guide.questions.some(q=>answers[q]?.trim())||workspace.brief.length+guide.questions.reduce((n,q)=>n+q.length+(answers[q]?.length||0),60)>12000} onClick={()=>void saveAnswers()}><Check size={15}/><UiText text={"Save my answers"}/></button></div>}
   <details className="business-guide-sources"><summary><UiText text={"What Sia read from your description"}/></summary>{guide.sourceQuotes.map((q,i)=><blockquote key={i}>{q}</blockquote>)}</details>
  </>:guideWorking?<div className="business-live" role="status"><span className="business-live-bar" aria-hidden="true"/><LoaderCircle size={18} className="spin" aria-hidden="true"/><div><strong><UiText text={run!.state==='queued'?'Sia’s guide is queued in the cloud':'Sia is reading your description'}/></strong><p><UiText text={"You can close this page. The guide appears here when it is ready."}/></p></div></div>
  :<div className="business-guide-start"><button type="button" className="office-primary" disabled={!!busy||!workspace.briefApproved||ownerHold} onClick={()=>void act('Sia is understanding your business',async()=>{await api.understandBusiness(token)})}><Sparkles size={16}/><UiText text={run&&['failed','waiting_owner'].includes(run.state)?'Ask Sia again':'Get my setup guide'}/></button>{startDisabledReason&&<small>{startDisabledReason}</small>}</div>}
  <small className="business-guide-footnote"><UiText text={"Suggestions only prepare your setup. Live replies, posts and payment requests still need a connected account and your approval."}/></small>
 </section>

 <RecordDocuments token={token} workspace={workspace} onChange={onChange} onChoose={onChoose} onOpenTask={onOpenTask}/>

 <section className="office-card business-memory-map" aria-labelledby="memory-title">
  <h2 id="memory-title"><UiText text={"What your team knows"}/></h2>
  <p><UiText text={"Your sources flow into one shared memory that your teams use. Choose any box to see exactly what is in it."}/></p>
  <div className="memory-flow" role="group" aria-label={localize("Business memory sources and uses")}>
   <div className="memory-column memory-sources"><h3><UiText text={"Sources"}/></h3>{nodes.filter(n=>n.group==='source').map(nodeButton)}</div>
   <div className="memory-column memory-core">{nodes.filter(n=>n.group==='memory').map(nodeButton)}</div>
   <div className="memory-column memory-uses"><h3><UiText text={"Used by"}/></h3>{nodes.filter(n=>n.group==='use').map(nodeButton)}</div>
  </div>
  <div className="memory-node-detail" aria-live="polite"><h3>{nodes.find(n=>n.id===node)?.label}</h3>{node==='facts'?<><p className="memory-brief">{workspace.brief.length>700?`${workspace.brief.slice(0,700).trimEnd()}…`:workspace.brief}</p><small><UiText text={"Change it under “Edit your business description” below."}/></small></>:node==='records'?(imports.length?<ul>{imports.map(f=><li key={f.id}><strong>{f.fileName}</strong>: {f.rowCount} <UiText text={f.kind==='practice'?'fictional practice entries':'private owner-reported entries'}/></li>)}</ul>:<p><UiText text={"No imported records yet. Your team can still use your approved description."}/></p>):node==='rules'?<p>{workspace.business?.rules||'Ask the owner about missing facts, discounts and uncertain commercial decisions. Approve external actions separately.'}</p>:node==='teams'?(workspace.blueprints.length?<ul>{workspace.blueprints.map(b=><li key={b.id}><strong>{b.teamIdentity?.lead||b.plan.name}</strong>: <UiText text={b.state==='active'?'active':b.state==='paused'?'paused':'not active yet'}/></li>)}</ul>:<p><UiText text={"No team yet. Choose a ready team on My work."}/></p>):node==='apps'?(workspace.connections.length||workspace.whatsappLinked?<><ul>{workspace.connections.map(c=><li key={c.toolkit}><strong>{c.toolkit}</strong>: {c.status.replaceAll('_',' ')}</li>)}{workspace.whatsappLinked&&<li><strong><UiText text={"WhatsApp"}/></strong><UiText text={": paired"}/></li>}</ul><small><UiText text={"Connected does not mean replying. Each team’s live actions are turned on separately in its desk."}/></small></>:<p><UiText text={"No account is connected. Advice and drafts work without one."}/></p>):<><p><UiText text={"Your approved description and saved records are shared inside this workspace. Customer replies and public pages use only approved public facts; imported history stays with owner-facing work."}/></p><p><UiText text={workspace.providers?.cognee?workspace.brain?.cogneeState==='not_indexed'?'Source search needs the latest sources saved below. Your team can already use the saved facts and records.':workspace.brain?.cogneeState==='failed'?'The last memory upload did not finish. Choose Save latest sources to memory to retry.':workspace.brain?.cogneeState==='ready'?'Sources are indexed. Search below to inspect exact passages.':'Your latest sources are being indexed. Wait a moment, then check again. Your team can still use your saved business facts.':'Your team can use your approved facts and saved records. Advanced source search is not enabled.'}/></p></>}</div>
 </section>
 </div>;
}
