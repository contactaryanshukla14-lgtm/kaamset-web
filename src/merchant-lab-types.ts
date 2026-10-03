/** Merchant Lab uses the same persisted fictional store as KaamSet. Amounts are integer paise. */
export type LabChannel='whatsapp'|'instagram'|'gmail';
export type LabPaymentState='success'|'pending'|'failed';
export interface LabProduct{id:string;name:string;category:string;description:string;packSize:string;pricePaise:number;stock:number;wholesaleMinimum:number;image?:string}
export interface LabCustomer{id:string;name:string;kind:'household'|'business';language:string;email:string;demoContact:string;consent:'demo_only';optedOut:boolean}
export interface LabOrder{id:string;invoiceId:string;customerId:string;lines:{productId:string;name:string;quantity:number;unitPricePaise:number}[];amountPaise:number;allocatedPaise:number;outstandingPaise:number;state:'paid'|'partial'|'overdue'|'open'|'cancelled'|'disputed';createdAt:string;dueAt:string;deliveryPaise:number;accepted:boolean;version:number}
export interface LabPayment{id:string;orderId:string|null;customerId:string|null;amountPaise:number;refundedPaise:number;currency:'INR';state:LabPaymentState;mode:string;createdAt:string;updatedAt:string;version:number;settlementId:string|null;provider:'demo';rawCallback:Record<string,unknown>;rawStatus:Record<string,unknown>}
export interface LabSettlement{id:string;paymentIds:string[];grossPaise:number;commissionPaise:number;gstPaise:number;adjustmentPaise:number;netPaise:number;state:'settled'|'pending'|'exception';payoutDate:string;settledDate:string|null;utr:string|null;version:number}
export interface LabRefund{id:string;paymentId:string;amountPaise:number;state:'success'|'pending'|'failed';reason:string;createdAt:string;version:number}
export interface LabPaymentRequest{id:string;orderId:string;customerId:string;amountPaise:number;state:'pending'|'paid'|'failed';createdAt:string;url:string;paymentId?:string;version:number}
export interface LabMessage{id:string;direction:'inbound'|'outbound';text:string;createdAt:string;jobId?:string;evidence?:string}
export interface LabConversation{id:string;channel:LabChannel;customerId:string;subject:string;messages:LabMessage[];state:'open'|'closed'|'owner_review';orderId?:string;demoOnly:true}
export interface LabJob{id:string;kind:'collection'|'instagram'|'wholesale'|'settlement'|'followup'|'content';title:string;teamId:string;specialist:string;conversationId?:string;orderId?:string;paymentId?:string;state:'ready'|'queued'|'working'|'completed'|'waiting_owner'|'failed'|'cancelled';stage?:string;result?:string;reason?:string;sourceIds:string[];createdAt:string;updatedAt:string;notBefore?:string;requestId?:string;model?:string;usage?:{inputTokens:number|null;outputTokens:number|null};version:number}
export interface LabEvent{id:string;type:string;entityId:string;entityVersion:number;createdAt:string;appliedAt:string;evidence:'fixture'|'demo_provider'|'actual_model'|'application';detail:Record<string,unknown>}
export interface LabTeam{id:string;name:string;outcome:string;state:'ready'|'active'|'needs_connection';members:{name:string;character:string;responsibility:string}[]}
export interface LabPresenterInput{requestKey:string;action:'enquiry'|'reply'|'payment'|'duplicate'|'advance_clock'|'channel'|'refund'|'settlement'|'reset';channel?:LabChannel;conversationId?:string;text?:string;paymentRequestId?:string;outcome?:LabPaymentState;amountPaise?:number;eventId?:string;minutes?:number;connected?:boolean;paymentId?:string;settlementId?:string}
export interface MerchantLabView{
  version:number;generation:string;seedVersion:string;merchant:{id:string;name:string;owner:string;location:string;timezone:string;hours:string;mode:'demo';description:string};
  connection:{state:'available'|'connected';capabilities:string[];connectedAt?:string;lastSyncAt?:string;receiptId?:string;transactionCount:number};
  counts:{products:number;customers:number;businessBuyers:number;transactions:number;openJobs:number};
  totals:{collectedPaise:number;settledPaise:number;unsettledPaise:number;refundsPaise:number;receivablePaise:number;feesPaise:number;successfulCount:number;pendingCount:number;failedCount:number};
  series:{date:string;collectedPaise:number;settledPaise:number;count:number}[];
  products:LabProduct[];customers:LabCustomer[];orders:LabOrder[];payments:LabPayment[];settlements:LabSettlement[];refunds:LabRefund[];requests:LabPaymentRequest[];conversations:LabConversation[];jobs:LabJob[];teams:LabTeam[];events:LabEvent[];
  commitments:{id:string;customerId:string;title:string;startsAt:string;state:'scheduled'|'completed'|'cancelled';simulated:true}[];
  sources:{id:string;title:string;kind:string;explicit:boolean;entityIds:string[]}[];
  providerModes:{mode:'demo'|'staging'|'production';state:string;note:string}[];
  cognee:{state:string;note:string};lastSyncAt:string;clockOffsetMs:number;
  demoChannels:Record<LabChannel,boolean>;
  assets:{id:string;alt:string;src:string;kind:'logo'|'photo'}[];
  documentation:{name:string;url:string;version:string;note:string}[];
}
export interface MerchantLabProps{state:MerchantLabView|null;busy:string;error:string;syncing:boolean;onOpenPrepared:()=>Promise<void>;onConnect:()=>Promise<void>;onRunJob:(id:string)=>Promise<void>;onPresenter:(input:LabPresenterInput)=>Promise<void>;onRefresh:()=>Promise<void>;onDownload:(kind:'pack'|'settlements'|'payments'|'catalogue'|'receivables'|'brief'|'guide')=>Promise<void>;onOpenWorkspace:()=>void}
