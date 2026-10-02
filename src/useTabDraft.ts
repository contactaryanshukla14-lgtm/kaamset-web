import {useEffect,useState} from 'react';

const prefix='kaamset_tab_draft:';
const lifetime=24*60*60*1000;
function read<T>(key:string,initial:T):T{
  if(!key)return initial;
  try{const stored=JSON.parse(sessionStorage.getItem(prefix+key)||'null');
    return stored&&typeof stored.savedAt==='number'&&Date.now()-stored.savedAt<lifetime&&stored.value ? {...initial,...stored.value}:initial;
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
