import {ArrowRight,Check,Cloud,FileCheck,Link2,Play,ReceiptText} from 'lucide-react';
import PixelTeammate from './PixelTeammate';
import {UiText,useLanguage} from './Language';
import type {LabJob,MerchantLabProps} from './merchant-lab-types';

export default function MerchantLabJourney({store,busy,onStart,onEvidence,onPayments,onActivity}:{store:NonNullable<MerchantLabProps['state']>;busy:boolean;onStart:(id:string)=>void;onEvidence:(id:string)=>void;onPayments:(id:string)=>void;onActivity:()=>void}){
 const {t}=useLanguage();
 const completed=store.jobs.filter(j=>j.state==='completed'),working=store.jobs.find(j=>j.state==='working'||j.state==='queued'),pending=store.requests.find(r=>r.state!=='paid'),first=store.jobs.find(j=>j.kind==='collection'&&j.state==='ready');
 const character=(job:LabJob)=>store.teams.flatMap(team=>team.members).find(member=>member.name===job.specialist)?.character||'milan';
 const title=working?`${working.specialist} ${t(working.state==='working'?'is working':'is queued in the cloud')}`:t(pending?'Your team has created a payment request':completed.length?'Your team’s work is ready to review':'Start with one useful job');
 const detail=working?'Work runs on the cloud. Open its evidence to follow the stored result.':pending?'Complete the simulated customer payment and watch both views update.':completed.length?'Read completed actions, source records and any decisions that need you.':'Milan will read the accepted cafe invoice, prepare a reminder and create a demo payment request.';
 const action=working?()=>onEvidence(working.id):pending?()=>onPayments(pending.id):first?()=>onStart(first.id):onActivity;
 const label=working?'Follow this job':pending?'Open payment request':first?'Start Milan’s collection':'Review completed work';
 return <section className="lab-journey" aria-label="Your next business step">
  <div className="lab-journey-copy"><span className="lab-eyebrow"><UiText text="YOUR NEXT STEP"/></span><h2>{title}</h2><p><UiText text={detail}/></p><button className="lab-button lab-primary" disabled={busy} onClick={action}>{first&&!working&&!pending?<Play size={15}/>:<ArrowRight size={15}/>}<UiText text={label}/></button></div>
  <div className="lab-journey-visual"><div className="lab-journey-character"><PixelTeammate id={working?character(working):'milan'} name={working?.specialist||'Milan'} state={working?.state||'ready'}/><span><Cloud size={13}/><UiText text="Runs in the cloud"/></span></div><ol><li className="is-done"><FileCheck size={17}/><span><strong><UiText text="Business prepared"/></strong><small>{store.counts.products} <UiText text="approved products"/></small></span><Check size={14}/></li><li className="is-done"><Link2 size={17}/><span><strong><UiText text="Demo merchant authorized"/></strong><small><UiText text="Scoped connection recorded"/></small></span><Check size={14}/></li><li className={completed.length?'is-done':'is-current'}><ReceiptText size={17}/><span><strong><UiText text="Completed work"/></strong><small>{completed.length} <UiText text="stored job results"/></small></span>{completed.length>0&&<Check size={14}/>}</li></ol></div>
 </section>;
}
