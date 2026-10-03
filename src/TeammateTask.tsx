import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Cloud,LoaderCircle,Send,Sparkles,Trash2} from 'lucide-react';
import type {Teammate,WorkspaceState} from './api';
import {api} from './api';
import {VoiceInput} from './OwnerTools';
import {selectedReadyTeam} from './ReadyTeams';
import {teamStarters} from './team-starters';
import {useTabDraft} from './useTabDraft';
import PixelTeammate from './PixelTeammate';

export default function TeammateTask({token,team,workspace,initialRequest,requestToEdit,onChange,onError,onDesk}:{token:string;team:Teammate;workspace:WorkspaceState;initialRequest?:string;requestToEdit?:{text:string;version:number};onChange:()=>Promise<unknown>;onError:(message:string)=>void;onDesk?:()=>void}){
  const [draft,setDraft]=useTabDraft(team.id+':task',{text:initialRequest||'',requestKey:crypto.randomUUID()});
  const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),flight=useRef(false),input=useRef<HTMLTextAreaElement>(null);
  const code=selectedReadyTeam(team.presetId),starters=code?teamStarters[code]:[];
  const jobs=workspace.tasks.filter(t=>t.blueprintId===team.id),pending=jobs.find(t=>['queued','working'].includes(t.state));
  const lead=team.teamIdentity?.lead||team.plan.name;
  const website=team.plan.skills.includes('website_publish');
  const disabled=busy||!!pending||!!workspace.controls?.paused||!!workspace.controls?.humanTakeover;
  function edit(text:string){setDraft({text,requestKey:crypto.randomUUID()});setSent(false)}
  useEffect(()=>{if(requestToEdit){edit(requestToEdit.text);input.current?.focus()}},[requestToEdit?.version]);
  async function submit(){if(flight.current||disabled||draft.text.trim().length<3)return;flight.current=true;setBusy(true);onError('');
    try{if(website&&onDesk){try{sessionStorage.setItem(`kaamset_website_brief_${team.id}`,draft.text.slice(0,1200))}catch{/* The publishing desk remains usable without tab storage. */}onDesk();return;}await api.runTeammate(token,team.id,draft.text,draft.requestKey);setDraft({text:'',requestKey:crypto.randomUUID()});setSent(true);await onChange()}
    catch(error){onError((error as Error).message)}finally{setBusy(false);flight.current=false}
  }
  return <section className="teammate-compose" aria-label={`Work with ${lead}`}>
    <div className="teammate-compose-head"><div><span className="office-eyebrow">Work with {lead}</span><h3>{website?'Build a website you can open and share.':'What would you like help with?'}</h3></div><PixelTeammate id={pending?.checkpoint?.stages.length?'chotu':team.character} name={pending?.checkpoint?.stages.length?'Nisha':lead} state={pending?.state==='working'?'working':'idle'}/></div>
    <div className="teammate-starters" role="group" aria-label="Suggested tasks">{starters.map(s=><button type="button" key={s.label} disabled={disabled} onClick={()=>{edit(s.request);input.current?.focus()}}><Sparkles size={14}/>{s.label}</button>)}</div>
    <label htmlFor={`job-${team.id}`} className="teammate-task-label">Your task <small>{workspace.business?.language||'Your language'} welcome</small></label>
    <textarea id={`job-${team.id}`} ref={input} rows={4} value={draft.text} maxLength={website?1200:2000} disabled={disabled} onChange={e=>edit(e.target.value)} placeholder={`Tell ${lead} what you need. A short message is enough.`}/>
    <div className="teammate-compose-footer"><span className="teammate-draft-note">{draft.text?'Draft saved in this tab':'Uses your approved business facts'}</span>{draft.text&&<button type="button" className="office-text" disabled={disabled} onClick={()=>edit('')}><Trash2 size={13}/> Clear draft</button>}</div>
    <div className="office-actions"><VoiceInput token={token} enabled={!!workspace.providers?.sarvam&&!disabled} onText={edit} onError={onError}/><button type="button" className="office-primary" disabled={disabled||draft.text.trim().length<3||workspace.limits.modelsRemaining<(website?3:2)} onClick={()=>void submit()}>{busy?<LoaderCircle size={15} className="spin"/>:<Send size={15}/>} {busy?'Starting your cloud job…':website?'Add assets & publish website':'Prepare & review'}</button>{onDesk&&<button type="button" className="office-secondary" onClick={onDesk}>Open {lead}’s desk <ArrowRight size={15}/></button>}</div>
    {workspace.limits.modelsRemaining<2&&<p className="office-notice">The workspace has reached its AI allowance. Saved results are still available.{workspace.limits.resetAt?` The allowance resets ${new Date(workspace.limits.resetAt).toLocaleString('en-IN')}.`:''}</p>}
    {workspace.controls?.paused||workspace.controls?.humanTakeover?<p className="office-notice">Your workspace is paused for owner control. Resume it from the top bar to start new work.</p>:pending?<div className="teammate-live" role="status"><Cloud size={18}/><div><strong>{pending.state==='queued'?'Queued in your cloud office':pending.checkpoint?.stages.length?'Nisha is checking the draft':`${lead} is preparing your result`}</strong><p>Closing this browser won’t cancel the job. Its result appears below.</p><ol className="team-job-stages">{['Saved in cloud',`${lead} prepares`,'Nisha reviews'].map((label,index)=>{const done=index===0||index===1&&!!pending.checkpoint?.stages.length,active=index===1&&pending.state==='working'&&!pending.checkpoint?.stages.length||index===2&&!!pending.checkpoint?.stages.length;return <li key={label} className={done?'is-done':active?'is-working':''}>{done?<Check size={12}/>:<i/>}{label}</li>})}</ol></div><LoaderCircle size={17} className="spin"/></div>:sent?<p className="office-success" role="status"><Check size={15}/> Job saved in your cloud office. The result will appear below.</p>:<p className="teammate-explainer">{website?'Next, Vijay asks for your photos and contact details, then builds and publishes your approved website. The live link appears after publication.':'This creates a reviewed answer or draft. Sending, publishing and bookings use the connected desks and your approved rules.'}</p>}
  </section>;
}
