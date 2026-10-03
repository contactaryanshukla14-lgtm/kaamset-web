import {useCallback,useEffect,useRef,useState} from 'react';
import MerchantLab from './MerchantLab';
import type {MerchantLabView,LabPresenterInput} from './merchant-lab-types';
import {labTokenKey,merchantLabApi} from './merchant-lab-api';
import {showSia} from './SiaAssistant';
export default function MerchantLabContainer({embedded=false}:{embedded?:boolean}){
 const [token,setToken]=useState(()=>localStorage.getItem(labTokenKey)),[state,setState]=useState<MerchantLabView|null>(null),[busy,setBusy]=useState(''),[error,setError]=useState(''),[syncing,setSyncing]=useState(false);
 const data=useRef(state),requestSequence=useRef(0),appliedSequence=useRef(0),active=useRef(true),reading=useRef(false),mutation=useRef(false);data.current=state;
 const refresh=useCallback(async(force=false)=>{if(!token||reading.current)return;reading.current=true;const seq=++requestSequence.current;try{const result=await merchantLabApi.read(token,force?undefined:data.current?.version,data.current?.generation);if(active.current&&seq>=appliedSequence.current){appliedSequence.current=seq;if(!('unchanged' in result))setState(result);setSyncing(false);setError('');}}catch(e){if(active.current){setSyncing(true);setError((e as Error).message);}}finally{reading.current=false;}},[token]);
 useEffect(()=>{active.current=true;void refresh(true);const timer=setInterval(()=>{if(!document.hidden)void refresh()},1000);const visible=()=>{if(!document.hidden)void refresh(true)};window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);return()=>{active.current=false;clearInterval(timer);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible)}},[refresh]);
 async function act(label:string,fn:()=>Promise<unknown>){if(mutation.current)return;mutation.current=true;setBusy(label);setError('');try{await fn();await refresh(true);}catch(e){setError((e as Error).message);showSia('general',(e as Error).message);}finally{setBusy('');mutation.current=false;}}
 async function open(){await act('Preparing the stored business',async()=>{const created=await merchantLabApi.prepare(token);localStorage.setItem(labTokenKey,created.token);setToken(created.token);setState(created.lab);});}
 const presenter=(input:LabPresenterInput)=>act('Applying the demo input',()=>merchantLabApi.presenter(token!,input));
 return <MerchantLab embedded={embedded} state={state} busy={busy} error={error} syncing={syncing} onOpenPrepared={open} onConnect={()=>act('Authorizing and synchronizing demo records',()=>merchantLabApi.connect(token!))} onRunJob={id=>act('Submitting the job to the cloud',()=>merchantLabApi.run(token!,id))} onPresenter={presenter} onRefresh={()=>refresh(true)} onDownload={kind=>act('Preparing the synthetic report',()=>merchantLabApi.download(token!,kind))} onOpenWorkspace={()=>{window.location.href='/?merchantLab=1'}}/>
}
