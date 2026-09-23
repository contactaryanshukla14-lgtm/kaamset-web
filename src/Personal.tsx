import {useState} from 'react';
import {ArrowRight,FileText,LockKeyhole,MessageCircle,Send,ShieldCheck,Upload} from 'lucide-react';
import {api} from './api';

type Exchange={question:string;answer:string};
type Mode='questions'|'markdown';

export default function Personal(){
  const [mode,setMode]=useState<Mode>('questions');
  const [name,setName]=useState('');
  const [service,setService]=useState('');
  const [area,setArea]=useState('');
  const [price,setPrice]=useState('');
  const [policy,setPolicy]=useState('');
  const [markdown,setMarkdown]=useState('');
  const [fileName,setFileName]=useState('');
  const [token,setToken]=useState<string|null>(null);
  const [question,setQuestion]=useState('');
  const [history,setHistory]=useState<Exchange[]>([]);
  const [remaining,setRemaining]=useState(8);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const brief=mode==='markdown'?markdown.trim():[
    `Business: ${name.trim()}`,`Services: ${service.trim()}`,`Service area: ${area.trim()}`,
    `Prices: ${price.trim()||'Not provided'}`,`Policies: ${policy.trim()||'Not provided'}`,
  ].join('\n');
  const canAsk=mode==='markdown'?brief.length>=20:name.trim().length>=2&&service.trim().length>=3&&area.trim().length>=2;

  async function upload(file?:File){
    if(!file)return;
    setError('');
    if(!/\.(md|markdown|txt)$/i.test(file.name)||file.size>12000){
      setError('Choose a Markdown or text file smaller than 12 KB.');return;
    }
    const content=await file.text();
    if(content.trim().length<20||content.length>12000){setError('The brief must contain 20–12,000 characters.');return;}
    setMarkdown(content);setFileName(file.name);setMode('markdown');
  }
  async function ask(){
    if(!canAsk||!question.trim()||busy||remaining===0)return;
    setBusy(true);setError('');
    try{
      const guest=token??(await api.create('mumbai-appliance')).token;
      if(!token)setToken(guest);
      const result=await api.personalAsk(guest,brief,question.trim(),history.slice(-4));
      setHistory(old=>[...old,{question:question.trim(),answer:result.answer}]);
      setRemaining(result.questionsRemaining);setQuestion('');
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }

  return <main className="personal-page"><div className="personal-intro"><div className="eyebrow dark">USE WITH YOUR BUSINESS / LIMITED GUEST MODE</div>
    <h1>Give the advisor your context.</h1><p>Upload a short Markdown brief or answer a few questions. Then ask the advisor to explain a service, refine a customer reply or find a missing policy. This workspace is read only: it cannot access your calendar, send messages or book appointments.</p>
    <div className="personal-limit"><ShieldCheck size={18}/> Eight questions per guest session. Your brief stays in this browser while you use the page; each question sends it to the AI service for an answer. Leave out customer data, passwords and payment details.</div></div>
    <div className="personal-grid"><section className="personal-panel"><div className="personal-tabs"><button className={mode==='questions'?'selected':''} onClick={()=>setMode('questions')}><MessageCircle size={16}/> Answer questions</button><button className={mode==='markdown'?'selected':''} onClick={()=>setMode('markdown')}><FileText size={16}/> Upload Markdown</button></div>
      {mode==='questions'?<div className="personal-form"><label>What is your business called?<input value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="Example: Aamchi Appliance Care"/></label><label>What services do you offer?<textarea value={service} maxLength={1000} onChange={e=>setService(e.target.value)} rows={2} placeholder="Services and what each includes"/></label><label>Where do you serve?<input value={area} maxLength={300} onChange={e=>setArea(e.target.value)} placeholder="Neighbourhoods or cities"/></label><label>What do you charge? <span>Optional</span><input value={price} maxLength={500} onChange={e=>setPrice(e.target.value)} placeholder="Visit fees or a price range"/></label><label>What rules should the advisor respect? <span>Optional</span><textarea value={policy} maxLength={1000} onChange={e=>setPolicy(e.target.value)} rows={2} placeholder="Hours, changes, warranty, exceptions"/></label></div>
      :<div className="personal-form"><label className="upload-box"><Upload size={24}/><strong>{fileName||'Choose a .md file'}</strong><span>Markdown or text, up to 12 KB</span><input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={e=>upload(e.target.files?.[0])}/></label><label>Business brief<textarea value={markdown} onChange={e=>setMarkdown(e.target.value.slice(0,12000))} rows={13} placeholder="# Business name\nServices, prices, locations, hours and policies…"/></label><span className="personal-count">{markdown.length.toLocaleString()} / 12,000 characters</span></div>}
    </section><section className="personal-panel personal-chat"><div className="personal-chat-head"><div className="eyebrow dark">READ-ONLY ADVISOR</div><h2>Ask about your business</h2></div><div className="personal-messages">{history.length?history.map((turn,i)=><div className="personal-exchange" key={i}><div className="personal-question">{turn.question}</div><div className="personal-answer">{turn.answer}</div></div>):<div className="personal-empty"><MessageCircle size={28}/><h3>Start with a useful question</h3><p>“How should I explain my visit fee to a customer?” or “Which policy is missing from this brief?”</p></div>}</div><div className="personal-composer"><div><LockKeyhole size={13}/> {remaining} questions left · No external actions</div><textarea value={question} maxLength={800} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask()}}} rows={3} placeholder={canAsk?'Ask a question about your brief…':'Complete the brief to start…'} aria-label="Question for the read-only advisor"/><button className="button button-dark" disabled={!canAsk||!question.trim()||busy||remaining===0} onClick={ask}>{busy?'Thinking…':'Ask the advisor'} {busy?<span/>:<Send size={16}/>}</button>{error&&<p className="personal-error" role="alert">{error}</p>}</div></section></div>
    <div className="personal-end"><strong>Ready for live tools?</strong><span>Calendar and account connection require verified business ownership and a scoped setup. The public judge demo uses dedicated fictional resources.</span><ArrowRight size={17}/></div>
  </main>;
}
