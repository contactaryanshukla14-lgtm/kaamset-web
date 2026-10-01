import {useEffect,useState} from 'react';
import {Alignment,Fit,Layout,RuntimeLoader,useRive} from '@rive-app/react-canvas';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');
RuntimeLoader.setWasmFallbackUrl('/rive/rive_fallback.wasm');
export default function AnimatedTeammate({id,state='idle'}:{id:string;state?:string}){
  const [failed,setFailed]=useState(false);
  const {rive,RiveComponent}=useRive({src:`/crew/${id}.riv`,autoplay:false,
    layout:new Layout({fit:Fit.Contain,alignment:Alignment.Center}),onLoadError:()=>setFailed(true)});
  useEffect(()=>{if(!rive)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced&&['working','queued','active','completed'].includes(state))rive.play('Sparkle');else rive.pause();
    const timer=state==='completed'?setTimeout(()=>rive.pause(),1500):undefined;return()=>{if(timer)clearTimeout(timer)};
  },[rive,state]);
  return <div className={`pixel-avatar pixel-${state}`} role="img" aria-label={`${id}, ${state.replaceAll('_',' ')}`}>
    {failed?<img src={`/crew/${id}.png`} alt=""/>:<RiveComponent className="pixel-rive"/>}
  </div>;
}
