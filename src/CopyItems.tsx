import {useState} from 'react';
import {Check,Copy} from 'lucide-react';
export default function CopyItems({items,onError}:{items:{label:string;text:string}[];onError:(message:string)=>void}){
  const [copied,setCopied]=useState<number|null>(null);
  async function copy(index:number){try{await navigator.clipboard.writeText(items[index].text);setCopied(index)}catch{onError('Clipboard access was unavailable. Select the message text below and copy it.')}}
  if(!items.length)return null;
  return <section className="copy-items" aria-label="Copy-ready drafts"><div className="copy-items-heading"><h4>Ready to use</h4><span>Reviewed drafts · approve before sending</span></div>{items.map((item,index)=><article className="copy-item" key={index}><div><strong>{item.label}</strong><button className="office-text" onClick={()=>void copy(index)} aria-label={`Copy ${item.label}`}>{copied===index?<Check size={14}/>:<Copy size={14}/>} {copied===index?'Copied':'Copy text'}</button></div><p>{item.text}</p></article>)}{copied!==null&&<span role="status" className="copy-feedback">{items[copied].label} copied. Review it before use.</span>}</section>;
}
