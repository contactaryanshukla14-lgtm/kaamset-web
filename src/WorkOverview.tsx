import {UiText} from './Language';
import {ArrowRight,BookOpen,Check,Cloud,Globe,ShoppingBag} from 'lucide-react';
import type {WorkspaceState} from './api';
import PixelTeammate from './PixelTeammate';
import {teamName} from './team-identity';

const statusNames:Record<string,string>={waiting_owner:'Needs you',proposed:'Not active yet',setup_needed:'Setup needed',not_connected:'Not connected',published:'Live',completed:'Done',failed:'Didn’t finish'};
export function Status({value}:{value:string}){
  const text=statusNames[value]||value.replaceAll('_',' ');
  return <span className={`office-status status-${value}`}><i aria-hidden="true"/>{text.charAt(0).toUpperCase()+text.slice(1)}</span>;
}

type Target='team'|'business'|'orders'|'website'|'counter'|'khata'|'shop';
type Item={key:string;title:string;detail:string;state:string;action:string;go:()=>void};
const money=(paise:number)=>`₹${(paise/100).toLocaleString('en-IN')}`;
const shorten=(text:string,max=90)=>text.length>max?`${text.slice(0,max).trimEnd()}…`:text;

export default function WorkOverview({workspace,busy,onNavigate,onOpenTeam,onShowTeams}:{workspace:WorkspaceState;busy:boolean;onNavigate:(page:Target)=>void;onOpenTeam:(blueprintId:string)=>void;onShowTeams:()=>void}){
  const teams=workspace.blueprints,active=teams.filter(b=>b.state==='active');
  const ownerHold=!!workspace.controls?.humanTakeover||!!workspace.controls?.paused;
  const liveChannels=Object.values(workspace.channels||{}).filter(c=>c.enabled&&c.ready).length;
  const nameOf=(id:string)=>{const b=teams.find(t=>t.id===id);return b?teamName(b):'Your team'};
  const guideRun=workspace.businessGuideRun;

  const running:Item[]=[
    ...workspace.tasks.filter(t=>['queued','working'].includes(t.state)).map(t=>({key:t.id,title:shorten(t.text,80),detail:`${nameOf(t.blueprintId)}${t.checkpoint?.stages.length?`, ${t.checkpoint.stages.length} stage${t.checkpoint.stages.length>1?'s':''} done`:''}`,state:t.state,action:'Open',go:()=>onOpenTeam(t.blueprintId)})),
    ...(workspace.sites||[]).filter(s=>['queued','working'].includes(s.state)).map(s=>({key:s.id,title:`Website for ${s.businessName}`,detail:s.studioCheckpoint?.stages.length?`${s.studioCheckpoint.stages.length} specialist steps done`:'Vijay’s team has the job',state:s.state,action:'Open',go:()=>onNavigate('website')})),
    ...(guideRun&&['queued','working'].includes(guideRun.state)?[{key:'guide',title:'Sia’s setup guide',detail:'Reading your description',state:guideRun.state,action:'Open',go:()=>onNavigate('business')}]:[]),
  ];

  const attention:Item[]=[
    ...(!workspace.briefApproved?[{key:'facts',title:'Approve your business facts',detail:'Teams use only facts you have approved.',state:'waiting_owner',action:'Review',go:()=>onNavigate('business')}]:[]),
    ...teams.filter(b=>b.state==='proposed').map(b=>({key:`p-${b.id}`,title:`${teamName(b)} is not active yet`,detail:b.feasibility.blockers[0]||'Check its job and rules, then activate it.',state:'proposed',action:'Review',go:()=>onOpenTeam(b.id)})),
    ...teams.filter(b=>b.state==='paused').map(b=>({key:`z-${b.id}`,title:`${teamName(b)} is paused`,detail:'Paused after a change or by you. Review it, then reactivate when ready.',state:'paused',action:'Review',go:()=>onOpenTeam(b.id)})),
    ...active.filter(b=>b.feasibility.blockers.length).map(b=>({key:`b-${b.id}`,title:`${teamName(b)} needs setup`,detail:b.feasibility.blockers[0],state:'setup_needed',action:'Fix',go:()=>onOpenTeam(b.id)})),
    ...((workspace.brain?.snapshot.awaitingOwner||0)>0?[{key:'orders',title:`${workspace.brain!.snapshot.awaitingOwner} order${workspace.brain!.snapshot.awaitingOwner>1?'s':''} waiting for your decision`,detail:'Open Orders & payments to review them.',state:'waiting_owner',action:'Open',go:()=>onNavigate('orders')}]:[]),
    ...(guideRun&&['failed','waiting_owner'].includes(guideRun.state)?[{key:'guide',title:'Sia’s setup guide needs you',detail:guideRun.reason||'Open Business & memory to continue.',state:guideRun.state,action:'Open',go:()=>onNavigate('business')}]:[]),
    ...workspace.tasks.filter(t=>['failed','waiting_owner'].includes(t.state)).slice(-3).reverse().map(t=>({key:t.id,title:shorten(t.result?.title||t.text,80),detail:t.reason||nameOf(t.blueprintId),state:t.state,action:'Open',go:()=>onOpenTeam(t.blueprintId)})),
    ...(workspace.sites||[]).filter(s=>s.state==='failed').slice(-1).map(s=>({key:s.id,title:`Website for ${s.businessName} didn’t publish`,detail:s.reason||'Open the website desk to try again.',state:'failed',action:'Open',go:()=>onNavigate('website')})),
  ];

  const latestDone=workspace.tasks.filter(t=>t.state==='completed').at(-1);
  const completed=workspace.tasks.filter(t=>t.state==='completed').length+(workspace.sites||[]).filter(s=>s.state==='published').length;
  const firstIdle=active.find(b=>!workspace.tasks.some(t=>t.blueprintId===b.id)&&!(b.plan.skills.includes('website_publish')&&workspace.sites?.length));
  const next:{title:string;detail:string;action:string;go:()=>void}|null=workspace.controls?.humanTakeover||workspace.controls?.paused?null
    :!workspace.briefApproved?{title:'Approve your business facts',detail:'Your teams wait until you confirm what they may use.',action:'Review my facts',go:()=>onNavigate('business')}
    :!teams.length?{title:'Choose your first ready team',detail:'Pick the job that takes most of your time. You can add more teams later.',action:'See ready teams',go:onShowTeams}
    :attention.find(a=>a.state==='proposed')?{title:attention.find(a=>a.state==='proposed')!.title.replace(' is not active yet',''),detail:'Saved, but not working yet. Check its job and permissions, then activate it.',action:'Review and activate',go:attention.find(a=>a.state==='proposed')!.go}
    :attention.find(a=>a.state==='paused')?{title:attention.find(a=>a.state==='paused')!.title,detail:'Your facts changed or you paused it. Review the job before it works again.',action:'Review team',go:attention.find(a=>a.state==='paused')!.go}
    :!workspace.businessGuide&&!guideRun?{title:'Get Sia’s setup guide',detail:'Sia reads your description, suggests the teams that fit and asks only what is missing.',action:'Open Business & memory',go:()=>onNavigate('business')}
    :firstIdle?{title:`Give ${firstIdle.teamIdentity?.lead||teamName(firstIdle)} a first job`,detail:'A short message is enough. The result comes back here for your review.',action:'Write a job',go:()=>onOpenTeam(firstIdle.id)}
    :latestDone?{title:'Read your latest result',detail:shorten(latestDone.result?.title||latestDone.text,110),action:'Open result',go:()=>onOpenTeam(latestDone.blueprintId)}
    :null;

  const crew=(active.length?active:teams).slice(0,4);
  const ops=workspace.merchantOps?.summary;
  const list=(items:Item[],empty:string)=>items.length?<ul className="work-list">{items.slice(0,6).map(item=><li key={item.key}><button type="button" onClick={item.go} disabled={busy}><span className="work-list-text"><strong>{item.title}</strong><small>{item.detail}</small></span><Status value={item.state}/><span className="work-list-action">{item.action}<ArrowRight size={14} aria-hidden="true"/></span></button></li>)}{items.length>6&&<li className="work-list-more"><UiText text={"and "}/>{items.length-6} <UiText text={"more"}/></li>}</ul>:<p className="work-empty">{empty}</p>;

  return <>
    <header className="work-hero">
      <div className="work-hero-text">
        <p className="work-date">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
        <h1><UiText text={"Namaste, "}/>{workspace.business?.name}.</h1>
        <p>{ownerHold?'Your office is paused for owner control. Resume when you are ready.':<>{active.length?`${active.length} team${active.length>1?'s are':' is'} active.`:'No team is active yet.'} {running.length?`${running.length} job${running.length>1?'s are':' is'} running in the cloud.`:'No jobs in progress.'} {liveChannels?`${liveChannels} approved live channel${liveChannels>1?'s are':' is'} enabled.`:''}</>} {attention.length?`${attention.length} thing${attention.length>1?'s need':' needs'} you.`:''}</p>
      </div>
      <div className="work-hero-crew" aria-hidden="true">
        {crew.length?crew.map(b=><PixelTeammate key={b.id} id={b.character} name={b.teamIdentity?.lead||b.plan.name} state={workspace.tasks.some(t=>t.blueprintId===b.id&&t.state==='working')?'working':'idle'}/>):<PixelTeammate id="chotu" name="Sia"/>}
      </div>
    </header>

    {next&&<section className="work-next" aria-labelledby="work-next-title"><div><span className="work-next-label"><UiText text={"Your next step"}/></span><h2 id="work-next-title">{next.title}</h2><p>{next.detail}</p></div><button type="button" className="office-primary" disabled={busy} onClick={next.go}>{next.action}<ArrowRight size={16}/></button></section>}

    <div className="work-columns">
      <section className={`work-panel work-attention ${attention.length?'has-items':''}`} aria-labelledby="work-attention-title">
        <div className="work-panel-head"><h2 id="work-attention-title"><UiText text={"Needs you"}/></h2><span>{attention.length}</span></div>
        {list(attention,'Nothing is waiting for you. New approvals and questions from your teams will appear here.')}
      </section>
      <section className={`work-panel work-running ${running.length?'has-items':''}`} aria-labelledby="work-running-title" aria-live="polite">
        <div className="work-panel-head"><h2 id="work-running-title"><Cloud size={17} aria-hidden="true"/><UiText text={"Running in the cloud"}/></h2><span>{running.length}</span></div>
        {list(running,'No jobs running. When you give a team a job, its progress shows here, even after you close this page.')}
        <p className="work-panel-foot"><Check size={13} aria-hidden="true"/>{completed?`${completed} finished result${completed>1?'s':''} saved in this workspace`:'No finished results yet'}</p>
      </section>
    </div>

    <section className="work-ledger" aria-labelledby="work-ledger-title">
      <div className="work-ledger-head"><h2 id="work-ledger-title"><UiText text={"Your shop records"}/></h2><p><UiText text={"Totals from records saved in this workspace."}/></p></div>
      <dl>
        <div><dt><UiText text={"Saved bills"}/></dt><dd>{ops?.bills||0}</dd></div>
        <div><dt><UiText text={"Outstanding udhaar"}/></dt><dd>{money(ops?.outstandingCreditPaise||0)}</dd></div>
        <div><dt><UiText text={"Unmet customer requests"}/></dt><dd>{ops?.unmetRequests||0}</dd></div>
        <div><dt><UiText text={"Verified collections"}/></dt><dd>{money(workspace.brain?.snapshot.verifiedCollectionPaise||0)}</dd></div>
      </dl>
      <div className="work-shortcuts">
        <button type="button" onClick={()=>onNavigate('counter')}><ShoppingBag size={19} aria-hidden="true"/><span><strong><UiText text={"Make a bill"}/></strong><small><UiText text={"Arjun’s counter"}/></small></span><ArrowRight size={16} aria-hidden="true"/></button>
        <button type="button" onClick={()=>onNavigate('khata')}><BookOpen size={19} aria-hidden="true"/><span><strong><UiText text={"Check udhaar"}/></strong><small><UiText text={"Naina’s khata"}/></small></span><ArrowRight size={16} aria-hidden="true"/></button>
        <button type="button" onClick={()=>onNavigate('shop')}><Globe size={19} aria-hidden="true"/><span><strong><UiText text={"Share my shop"}/></strong><small><UiText text={"Tara’s online dukaan"}/></small></span><ArrowRight size={16} aria-hidden="true"/></button>
      </div>
    </section>
  </>;
}
