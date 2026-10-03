import type {MerchantLabView,LabPresenterInput} from './merchant-lab-types';
const base=(import.meta.env.DEV?'':import.meta.env.VITE_KAAMSET_API_URL||'https://foundation-production-api-production.up.railway.app').replace(/\/$/,'');
const root=base+'/v1/foundation/kaamset/merchant-lab';
export const labTokenKey='kaamset_lab_token';
export class MerchantLabApiError extends Error{constructor(message:string,readonly status:number){super(message);}}
async function request<T>(path:string,token:string|null,body?:unknown){
 const response=await fetch(root+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(body!==undefined?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000),cache:'no-store'});
 if(!response.ok){const result=await response.json().catch(()=>({}));throw new MerchantLabApiError(result.error?.message||result.message||`Merchant Lab is temporarily unavailable (${response.status}).`,response.status);}return response.json() as Promise<T>;
}
export const merchantLabApi={
 prepare:(token:string|null)=>request<{token:string;lab:MerchantLabView}>('/prepare',token,{}),
 read:(token:string,version?:number,generation?:string)=>request<MerchantLabView|{unchanged:true;version:number;generation:string;lastSyncAt:string}>(version===undefined?'':`?sinceVersion=${version}${generation?`&sinceGeneration=${generation}`:''}`,token),
 connect:(token:string)=>request('/connect',token,{approved:true}),
 run:(token:string,id:string)=>request(`/jobs/${id}/run`,token,{}),
 presenter:(token:string,input:LabPresenterInput)=>request('/presenter',token,input),
 candidates:(token:string)=>request<{candidates:{id:string;channel:string;customerName:string;preview:string;createdAt:string}[];note:string}>('/live/candidates',token),
 bind:(token:string,conversationId:string,itemId:string)=>request('/live/bind',token,{conversationId,itemId,approved:true}),
 liveReply:(token:string,conversationId:string,messageId:string)=>request('/live/reply',token,{conversationId,messageId,approved:true,requestKey:crypto.randomUUID()}),
 async download(token:string,kind:string){const response=await fetch(`${root}/download/${kind}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('The demo report could not be downloaded. Try again.');const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=/filename="([^"]+)"/.exec(response.headers.get('Content-Disposition')||'')?.[1]||(kind==='pack'?'KAAMSET-SYNTHETIC-DEMO-PACK.zip':`SYNTHETIC-${kind}.csv`);a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);},
};
