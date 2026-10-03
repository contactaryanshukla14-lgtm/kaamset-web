import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {MessageCircle,Sparkles,X} from 'lucide-react';
import {api} from './api';
import {useLanguage} from './Language';
import PixelTeammate from './PixelTeammate';
type HelpIssue='field'|'instagram_limit'|'memory'|'microphone'|'assets'|'general';
// Passive guidance never interrupts work. The launcher opens the explanation on demand.
export function showSia(issue:HelpIssue,message:string){window.dispatchEvent(new CustomEvent('kaamset-sia',{detail:{issue,message}}));}
export default function SiaAssistant({getToken}:{getToken:()=>Promise<string>}){
  const {language,t}=useLanguage(),[open,setOpen]=useState(false),[issue,setIssue]=useState<HelpIssue>('general'),[hint,setHint]=useState('Tell me where you are stuck. I can explain setup in your language.'),[fieldLabel,setFieldLabel]=useState(''),[question,setQuestion]=useState(''),[answer,setAnswer]=useState(''),[busy,setBusy]=useState(false);
  const inFlight=useRef(false),seen=useRef(''),mounted=useRef(true),languageRef=useRef(language),editedFields=useRef(new WeakSet<Element>());languageRef.current=language;
  const [dialogHost,setDialogHost]=useState<HTMLElement|null>(null),dialogRef=useRef<HTMLElement|null>(null);
  useEffect(()=>{mounted.current=true;const help=(event:Event)=>{const {issue,message,fieldLabel}=(event as CustomEvent).detail;if(!message||message===seen.current)return;seen.current=message;setIssue(issue);setHint(message);setFieldLabel(fieldLabel||'');setAnswer('');};
    const fieldError=(event:Event)=>{const target=event.target;if(!(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement)||target.type==='password'||target.closest('.sia-widget'))return;
      const activeDialog=document.querySelector('[role="dialog"][aria-modal="true"]');if(activeDialog&&!activeDialog.contains(target))return;
      if(event.type==='focusout'&&!target.value&&!editedFields.current.has(target))return;
      const tooShort='minLength' in target&&target.minLength>0&&target.value.trim().length<target.minLength;
      if(target.validity.valid&&!tooShort||event.type==='focusout'&&!target.value&&!target.required)return;
      let message='Check this field before continuing.';
      if(target.validity.valueMissing)message='Please fill this required field.';
      else if(target.validity.typeMismatch)message='Use a complete email address, such as name@example.com.';
      else if('minLength' in target&&target.minLength>0&&target.value.trim().length<target.minLength)message=`Use at least ${target.minLength} characters in this field.`;
      else if(target.validity.patternMismatch)message='Check the format shown beside this field.';
      target.setAttribute('aria-invalid','true');window.dispatchEvent(new CustomEvent('kaamset-sia',{detail:{issue:'field',message,fieldLabel:target.labels?.[0]?.textContent?.trim().slice(0,80)||''}}));
    };
    const edited=(event:Event)=>{const target=event.target;if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement){editedFields.current.add(target);if(target.validity.valid)target.removeAttribute('aria-invalid');}};
    const observe=()=>{const dialog=[...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')].at(-1)||null;if(dialog!==dialogRef.current){dialogRef.current=dialog;setDialogHost(dialog)}const errors=[...document.querySelectorAll<HTMLElement>('[role="alert"],.office-error,.workspace-error,.office-setup-error')].filter(el=>!el.closest('.sia-widget'));const last=errors.at(-1),message=last?.textContent?.trim();if(message&&message!==seen.current){showSia(/Cognee|memory/i.test(message)?'memory':/microphone|voice|Sarvam/i.test(message)?'microphone':/photo|image|asset/i.test(message)?'assets':'general',message.slice(0,600));}};
    const observer=new MutationObserver(observe);observe();
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});window.addEventListener('kaamset-sia',help);document.addEventListener('invalid',fieldError,true);document.addEventListener('focusout',fieldError);document.addEventListener('input',edited);
    return()=>{mounted.current=false;observer.disconnect();window.removeEventListener('kaamset-sia',help);document.removeEventListener('invalid',fieldError,true);document.removeEventListener('focusout',fieldError);document.removeEventListener('input',edited)};
  },[]);
  useEffect(()=>{setAnswer('')},[language]);
  async function ask(){if(inFlight.current)return;inFlight.current=true;setBusy(true);setAnswer('');try{const token=await getToken();const result=await api.help(token,{language,issue,question:(question.trim()||hint).slice(0,500)});if(mounted.current&&languageRef.current===language)setAnswer(result.answer);}catch{if(mounted.current)setAnswer(t('Sia could not answer right now. Follow the guidance above, or try again shortly.'));}finally{inFlight.current=false;if(mounted.current)setBusy(false)}}
  const widget=<aside className="sia-widget" aria-label={t('Sia setup help')}>
    {open&&<section className="sia-panel" aria-labelledby="sia-title"><header><PixelTeammate id="chotu" name="Sia"/><div><h2 id="sia-title">Sia</h2><small>{t('Your setup helper')} · {language}</small></div><button type="button" className="office-icon-button" aria-label={t('Close Sia help')} onClick={()=>setOpen(false)}><X size={18}/></button></header><p className="sia-hint" role="status">{fieldLabel&&<strong className="sia-field-label">{fieldLabel}</strong>}{t(hint).replace(/Use at least (\d+) characters in this field\./,(_,n)=>t('Use at least {count} characters in this field.').replace('{count}',n))}</p><label>{t('Ask a question')}<textarea rows={2} maxLength={500} value={question} onChange={e=>setQuestion(e.target.value)} placeholder={t('How do I complete this step?')}/></label><small>{t('Do not share passwords, OTPs or payment keys here.')}</small><button type="button" className="office-primary" disabled={busy} onClick={()=>void ask()}><Sparkles size={16}/>{t(busy?'Sia is answering…':'Ask Sia to explain')}</button>{answer&&<p className="sia-answer" aria-live="polite">{answer}</p>}</section>}
    <button type="button" className="sia-launcher" aria-expanded={open} onClick={()=>setOpen(!open)}><MessageCircle size={18}/>{t(open?'Minimise Sia':'Need help? Ask Sia')}</button>
  </aside>;
  return dialogHost?createPortal(widget,dialogHost):widget;
}
