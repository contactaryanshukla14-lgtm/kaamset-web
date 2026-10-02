import {useEffect,useState} from 'react';

const prefix='kaamset_tab_draft:';
const lifetime=24*60*60*1000;
function read<T extends object>(key:string,initial:T):T{
  if(!key)return initial;
  try{const stored=JSON.parse(sessionStorage.getItem(prefix+key)||'null');
    if(!stored||typeof stored.savedAt!=='number'||stored.savedAt>Date.now()+60000||Date.now()-stored.savedAt>=lifetime||!stored.value||typeof stored.value!=='object')return initial;
    const restored={...initial};
    for(const [field,expected] of Object.entries(initial)){
      const value=stored.value[field];
      if(Array.isArray(expected)){
        if(field==='lines'&&Array.isArray(value)&&value.length<=20&&value.every(line=>line&&typeof line.offerId==='string'&&line.offerId.length<=100&&Number.isInteger(line.quantity)&&line.quantity>=0&&line.quantity<=1000))Object.assign(restored,{[field]:value});
      }else if(typeof value===typeof expected&&(typeof value!=='string'||value.length<=6000))Object.assign(restored,{[field]:value});
    }
    return restored;
  }catch{return initial}
}

/** Unapproved work stays in this tab, scoped to the workspace's unique teammate ID. */
export function useTabDraft<T extends object>(key:string,initial:T){
  const [entry,setEntry]=useState(()=>({key,value:read(key,initial)}));
  const value=entry.key===key?entry.value:read(key,initial);
  useEffect(()=>{
    if(entry.key!==key){setEntry({key,value:read(key,initial)});return}
    if(!key)return;
    try{sessionStorage.setItem(prefix+key,JSON.stringify({savedAt:Date.now(),value:entry.value}))}catch{/* A full or disabled store must not block the job. */}
  },[key,entry]);
  const update=(next:T|((previous:T)=>T))=>setEntry(previous=>({key,value:typeof next==='function'?next(previous.key===key?previous.value:read(key,initial)):next}));
  return [value,update] as const;
}
