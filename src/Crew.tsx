import {useState} from 'react';
import {ArrowRight,CalendarDays,Mail,MessageCircle,ShieldCheck,Sparkles,Users} from 'lucide-react';

const crew=[
  {id:'tara',name:'Tara',role:'Instagram closer',channel:'Instagram',status:'Connection setup needed',text:'Qualifies inbound DMs, proposes a calendar slot and flags a conversation for a person.',icon:MessageCircle},
  {id:'milo',name:'Milo',role:'Gmail sales desk',channel:'Gmail',status:'Connection setup needed',text:'Handles enquiries with approved offers, follow-ups and a clear handoff to your team.',icon:Mail},
  {id:'baba',name:'Baba',role:'Lead researcher',channel:'Sales family',status:'Workflow preview',text:'Finds and checks leads against your ideal customer profile.',icon:Sparkles},
  {id:'ma',name:'Ma',role:'Outreach lead',channel:'Sales family',status:'Workflow preview',text:'Plans consented outreach and keeps the offer consistent.',icon:Users},
  {id:'chotu',name:'Chotu',role:'Lead tracker',channel:'Sales family',status:'Workflow preview',text:'Tracks replies, next steps and handoffs so no lead falls through.',icon:CalendarDays},
] as const;

export default function Crew({onAdvisor,onDemo}:{onAdvisor:(idea:string)=>void;onDemo:()=>void}){
  const [idea,setIdea]=useState('');
  const [spawned,setSpawned]=useState(false);
  const chosen=/instagram|dm|social/i.test(idea)?crew[0]:/mail|inquir|email/i.test(idea)?crew[1]:/lead|prospect|outreach/i.test(idea)?crew[2]:crew[0];
  return <section className="crew-section" id="crew"><div className="crew-heading"><div className="eyebrow dark">MEET THE TEAM</div><h2>Describe the work.<br/><span>Meet your teammate.</span></h2><p>Give KaamSet a job. It turns your brief into a role and a character; the limited guest advisor helps you refine the playbook. Channel connections require their owner’s consent.</p></div>
    <div className="spawn-console"><div className="spawn-copy"><span className="console-kicker">01 / CREATE A ROLE</span><label htmlFor="agent-idea">What should your agent handle?</label><div className="spawn-input"><input id="agent-idea" value={idea} maxLength={240} onChange={e=>{setIdea(e.target.value);setSpawned(false)}} onKeyDown={e=>{if(e.key==='Enter'&&idea.trim().length>=12)setSpawned(true)}} placeholder="Handle Instagram enquiries and book qualified calls"/><button type="button" disabled={idea.trim().length<12} onClick={()=>setSpawned(true)}>Spawn <ArrowRight size={16}/></button></div><small>Try: “Research leads for my home services business.”</small></div><div className="spawn-result" aria-live="polite"><img src={`/crew/${chosen.id}.png`} alt=""/><div><span>{spawned?'ROLE CREATED IN THIS BROWSER':'YOUR TEAMMATE PREVIEW'}</span><strong>{chosen.name} <em>· {chosen.role}</em></strong><p>{spawned?'The role is ready for a read-only playbook trial. Live channel actions need a connected account.':'Enter a task to reveal a matching teammate.'}</p>{spawned&&<button onClick={()=>onAdvisor(idea)}>Build the playbook <ArrowRight size={14}/></button>}</div></div></div>
    <div className="crew-grid">{crew.map((member,i)=>{const Icon=member.icon;return <article className={`crew-card crew-${member.id}`} key={member.id}><div className="crew-avatar"><img src={`/crew/${member.id}.png`} alt={`${member.name}, pixel character for ${member.role}`}/></div><div className="crew-card-body"><div className="crew-number">{String(i+1).padStart(2,'0')} <span>{member.channel}</span></div><h3>{member.name}</h3><strong><Icon size={13}/> {member.role}</strong><p>{member.text}</p><span className="crew-status"><span/> {member.status}</span></div></article>})}</div>
    <div className="crew-reality"><ShieldCheck size={19}/><div><strong>Try the finished action loop today</strong><p>The live fictional merchant demo handles a customer chat, verified Calendar booking, Sheet record and human pause/takeover. Instagram, Gmail and prospecting are shown as the next deployment paths.</p></div><button onClick={onDemo}>Open live demo <ArrowRight size={16}/></button></div>
  </section>;
}
