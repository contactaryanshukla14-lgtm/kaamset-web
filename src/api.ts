export type Merchant = {name:string;label:string;city:string;areas:string[];hours:{days:number[];opens:string;closes:string;noticeHours:number};services:{code:string;name:string;priceInr:number;durationMinutes:number;description:string}[];terms:{parts:string;cancellation:string;warranty:string;discount:string};faq:{question:string;answer:string}[]};
export type DemoState = {session:{id:string;expiresAt:string;merchant:Merchant;paused:boolean;humanTakeover:boolean;limits:{messagesRemaining:number;toolsRemaining:number}};turns:{id:string;customerText:string;replyText:string|null;state:string;specialist:string|null;activity:Record<string,unknown>[];createdAt:string;updatedAt:string}[];bookings:{id:string;serviceCode:string;area:string;startsAt:string;endsAt:string;status:string;calendarEventId:string|null;sheetState:string}[];actions:{id:string;kind:string;state:string;receipt:Record<string,unknown>|null;createdAt:string;updatedAt:string}[];offeredSlots:{id:string;start:string;end:string;expiresAt:string}[];memory:Record<string,unknown>};
const base=(import.meta.env.VITE_KAAMSET_API_URL || 'https://foundation-production-api-production.up.railway.app').replace(/\/$/,'');
const root=`${base}/v1/foundation/kaamset`;

async function request<T>(path:string, method='GET', token?:string, body?:unknown):Promise<T>{
  const response=await fetch(`${root}${path}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||data.error||`Request failed (${response.status})`);
  return data as T;
}
export const api={
  readiness:()=>request<{enabled:boolean;connections:{calendar:boolean;sheet:boolean};payment:string;businesses:string}>('/readiness'),
  create:(merchant:'mumbai-appliance'|'harbour-appliance')=>request<{token:string;session:DemoState['session']}>('/sessions','POST',undefined,{merchant}),
  state:(token:string)=>request<DemoState>('/state','GET',token),
  turn:(token:string,text:string)=>request<{turnId:string;state:string}>('/turns','POST',token,{requestKey:crypto.randomUUID(),text}),
  control:(token:string,action:'pause'|'resume'|'takeover'|'release')=>request<{paused:boolean;humanTakeover:boolean}>('/control','POST',token,{action}),
  personalAsk:(token:string,brief:string,question:string,history:{question:string;answer:string}[])=>request<{answer:string;questionsRemaining:number;actionsAvailable:false}>('/personal/ask','POST',token,{brief,question,history}),
};
