import {lazy,Suspense} from 'react';
const Animated=lazy(()=>import('./AnimatedTeammate'));
export default function PixelTeammate({id,state='idle'}:{id:string;state?:string}){
 const still=<div className={`pixel-avatar pixel-${state}`} role="img" aria-label={`${id}, ${state}`}><img src={`/crew/${id}.png`} alt=""/></div>;
 return ['working','queued','active','completed'].includes(state)?<Suspense fallback={still}><Animated id={id} state={state}/></Suspense>:still;
}
