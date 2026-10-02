export type Merchant = {
  name: string;
  label: string;
  city: string;
  areas: string[];
  hours: { days: number[]; opens: string; closes: string; noticeHours: number };
  services: {
    code: string;
    name: string;
    priceInr: number;
    durationMinutes: number;
    description: string;
  }[];
  terms: {
    parts: string;
    cancellation: string;
    warranty: string;
    discount: string;
  };
  faq: { question: string; answer: string }[];
};
export type DemoState = {
  session: {
    id: string;
    expiresAt: string;
    merchant: Merchant;
    paused: boolean;
    humanTakeover: boolean;
    limits: { messagesRemaining: number; toolsRemaining: number };
  };
  turns: {
    id: string;
    customerText: string;
    replyText: string | null;
    state: string;
    specialist: string | null;
    activity: Record<string, unknown>[];
    createdAt: string;
    updatedAt: string;
  }[];
  bookings: {
    id: string;
    serviceCode: string;
    area: string;
    startsAt: string;
    endsAt: string;
    status: string;
    calendarEventId: string | null;
    sheetState: string;
  }[];
  actions: {
    id: string;
    kind: string;
    state: string;
    receipt: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  }[];
  offeredSlots: { id: string; start: string; end: string; expiresAt: string }[];
  memory: Record<string, unknown>;
};
const base = (
  import.meta.env.DEV
    ? ""
    : import.meta.env.VITE_KAAMSET_API_URL ||
      "https://foundation-production-api-production.up.railway.app"
).replace(/\/$/, "");
const root = `${base}/v1/foundation/kaamset`;

async function request<T>(
  path: string,
  method = "GET",
  token?: string,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), path === "/teammates" || /^\/teammates\/[^/]+\/recheck$/.test(path) ? 90000 : 30000);
  try {
  const response = await fetch(`${root}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: controller.signal,
  });
  const data = await response.json().catch((error) => {
    if (controller.signal.aborted) throw error;
    return {};
  });
  if (!response.ok)
    throw new Error(
      data.detail ||
        data.message ||
        data.error ||
        `Request failed (${response.status})`,
    );
  return data as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(method === "GET"
      ? "This check timed out. Refresh to check the current cloud state."
      : "The request timed out before its result was confirmed. Cloud work may still continue. Refresh the workspace before retrying; do not repeat an uncertain payment or message.");
    throw error;
  } finally {
    clearTimeout(deadline);
  }
}
export const api = {
  signOut: (token: string) => request("/accounts/logout", "POST", token),
  onboard: (input: BusinessSetup, token?: string) =>
    request<{ token: string; workspace: WorkspaceState }>(
      "/onboarding",
      "POST",
      token,
      input,
    ),
  account: (
    action: "register" | "verify" | "login" | "recover" | "reset",
    input: unknown,
  ) =>
    request<{
      state: string;
      token?: string;
      email?: string;
      business?: string;
      workspaces?: { tenantId: string; business: string }[];
    }>(`/accounts/${action}`, "POST", undefined, input),
  paymentSetup: (
    token: string,
    input: {
      mid: string;
      merchantKey: string;
      mode: "staging" | "production";
      websiteName: string;
      ownerConfirmed: true;
    },
  ) => request("/payments/merchant", "PUT", token, input),
  recipe: (token: string, id: string) =>
    request<{
      format: "kaamset-teammate-v1";
      name: string;
      request: string;
      rules: string[];
    }>(`/teammates/${id}/recipe`, "GET", token),
  buildSite: (
    token: string,
    input: {
      blueprintId: string;
      businessName: string;
      instructions: string;
      phone?: string;
      publishApproved: true;
      assets?: { alt: string; photo: string; rightsConfirmed: true }[];
    },
  ) =>
    request<PublishedSite>("/sites", "POST", token, {
      ...input,
      requestKey: crypto.randomUUID(),
    }),
  unpublishSite: (token: string, id: string) =>
    request(`/sites/${id}/unpublish`, "POST", token),
  publicSite: (slug: string) =>
    request<PublicSite>(`/sites/public/${encodeURIComponent(slug)}`),
  approveInboxReply: (token: string, id: string, text: string) =>
    request(`/inbox/${id}/approve`, "POST", token, { text, approved: true }),
  reminderContacts: (token: string) =>
    request<{ contacts: { id: string; name: string }[] }>(
      "/whatsapp/contacts",
      "GET",
      token,
    ),
  scheduleReminder: (
    token: string,
    input: {
      blueprintId: string;
      contactId: string;
      message: string;
      at: string;
      consentConfirmed: true;
      orderId?: string;
    },
  ) =>
    request("/reminders", "POST", token, {
      ...input,
      requestKey: crypto.randomUUID(),
    }),
  cancelReminder: (token: string, id: string) =>
    request(`/reminders/${id}/cancel`, "POST", token),
  commerceSetup: (token: string, offers: Offer[], hours?: CommerceHours, expectedSnapshotHash?: string) =>
    request<{revision: number; offers: Offer[]}>("/commerce", "PUT", token, {
      approved: true,
      ...(expectedSnapshotHash ? { expectedSnapshotHash } : {}),
      offers,
      hours: hours || {
        days: [1, 2, 3, 4, 5, 6],
        opens: 10,
        closes: 19,
        noticeHours: 1,
      },
    }),
  approveCalendar: (token: string) =>
    request("/commerce/calendar", "POST", token),
  quote: (token: string, offerId: string, quantity: number) =>
    request<Order & { url: string }>("/commerce/quotes", "POST", token, {
      offerId,
      quantity,
    }),
  approveQuote: (token: string, id: string, deliveryPaise: number) =>
    request<Order & { url: string }>(
      `/commerce/quotes/${id}/approve`,
      "POST",
      token,
      { deliveryPaise, stockConfirmed: true },
    ),
  verifyOrder: (token: string, id: string) =>
    request(`/commerce/orders/${id}/verify`, "POST", token),
  orderPayment: (token: string, id: string) =>
    request(`/commerce/orders/${id}/payment`, "POST", token),
  customerOrder: (cap: string) =>
    request<Order>(`/customer-orders/${encodeURIComponent(cap)}`),
  orderSlots: (cap: string) =>
    request<{ slots: Slot[] }>(
      `/customer-orders/${encodeURIComponent(cap)}/slots`,
    ),
  acceptOrder: (cap: string, slotId?: string) =>
    request<Order>(
      `/customer-orders/${encodeURIComponent(cap)}/accept`,
      "POST",
      undefined,
      { accepted: true, slotId },
    ),
  channel: (token: string, channel: string, enabled: boolean) =>
    request(`/channels/${channel}`, "POST", token, { enabled }),
  whatsapp: (token: string) =>
    request<WhatsAppState>("/whatsapp", "GET", token),
  whatsappSales: (token: string) =>
    request<WhatsAppSalesState>("/whatsapp/sales", "GET", token),
  configureWhatsAppSales: (token: string, input: WhatsAppSalesSetup) =>
    request<NonNullable<WhatsAppSalesState["settings"]>>("/whatsapp/sales", "PUT", token, input),
  whatsappConversationControl: (token: string, id: string, action: "takeover" | "resume") =>
    request(`/whatsapp/sales/conversations/${encodeURIComponent(id)}/control`, "POST", token, { action }),
  whatsappOwnerReply: (token: string, id: string, text: string, requestKey: string = crypto.randomUUID()) =>
    request(`/whatsapp/sales/conversations/${encodeURIComponent(id)}/reply`, "POST", token, {
      text, approved: true, requestKey,
    }),
  whatsappAction: (token: string, action: string) =>
    request(`/whatsapp/${action}`, "POST", token),
  speech: (token: string, audio: string, mime: string) =>
    request<{ transcript: string; language_code: string | null }>(
      "/speech",
      "POST",
      token,
      { audio, mime },
    ),
  remember: (token: string) =>
    request<{ state: string }>("/memory/remember", "POST", token),
  recall: (token: string, query: string) =>
    request<{ state: string; excerpts: string[] }>(
      "/memory/recall",
      "POST",
      token,
      { query },
    ),
  preparePost: (
    token: string,
    input: {
      blueprintId: string;
      caption: string;
      headline: string;
      photo: string;
      rightsConfirmed: boolean;
    },
  ) => request<ContentPost>("/posts", "POST", token, input),
  approvePost: (token: string, p: ContentPost, notBefore: number) =>
    request<ContentPost>(`/posts/${p.id}/approve`, "POST", token, {
      contentHash: p.contentHash,
      notBefore,
    }),
  postPreview: (token: string, id: string) =>
    request<{ url: string }>(`/posts/${id}/preview`, "GET", token),
  verifyPost: (token: string, id: string) =>
    request<ContentPost>(`/posts/${id}/verify`, "POST", token),
  payment: (token: string, bookingId: string) =>
    request<Payment>(`/payments`, "POST", token, {
      bookingId,
      quoteAccepted: true,
    }),
  verifyPayment: (token: string, id: string) =>
    request<Payment>(`/payments/${id}/verify`, "POST", token),
  workspace: (token: string) =>
    request<WorkspaceState>("/workspace", "GET", token),
  saveBrief: (token: string, brief: string, approved: boolean) =>
    request("/workspace/brief", "PUT", token, { brief, approved }),
  build: (token: string, task: string, requestKey: string = crypto.randomUUID()) =>
    request<Teammate>("/teammates", "POST", token, {
      request: task,
      requestKey,
    }),
  recheckTeammate: (token: string, b: Teammate) =>
    request<Teammate>(`/teammates/${b.id}/recheck`, "POST", token, {
      revision: b.revision,
    }),
  teammateControl: (
    token: string,
    b: Teammate,
    action: "activate" | "pause" | "accept_scope",
  ) =>
    request<Teammate | { rebuild: string }>(
      `/teammates/${b.id}/control`,
      "POST",
      token,
      { revision: b.revision, action },
    ),
  runTeammate: (token: string, id: string, text: string) =>
    request<{ id: string }>(`/teammates/${id}/run`, "POST", token, {
      text,
      requestKey: crypto.randomUUID(),
    }),
  connect: (token: string, toolkit: string) =>
    request<{ url: string }>(`/connections/${toolkit}`, "POST", token),
  refreshConnection: (token: string, toolkit: string) =>
    request(`/connections/${toolkit}/refresh`, "POST", token),
  disconnect: (token: string, toolkit: string) =>
    request(`/connections/${toolkit}`, "DELETE", token),
  readiness: () =>
    request<{
      enabled: boolean;
      connections: { calendar: boolean; sheet: boolean };
      payment: string;
      businesses: string;
    }>("/readiness"),
  create: (merchant: "mumbai-appliance" | "harbour-appliance") =>
    request<{ token: string; session: DemoState["session"] }>(
      "/sessions",
      "POST",
      undefined,
      { merchant },
    ),
  state: (token: string) => request<DemoState>("/state", "GET", token),
  turn: (token: string, text: string) =>
    request<{ turnId: string; state: string }>("/turns", "POST", token, {
      requestKey: crypto.randomUUID(),
      text,
    }),
  control: (
    token: string,
    action: "pause" | "resume" | "takeover" | "release",
  ) =>
    request<{ paused: boolean; humanTakeover: boolean }>(
      "/control",
      "POST",
      token,
      { action },
    ),
  personalAsk: (
    token: string,
    brief: string,
    question: string,
    history: { question: string; answer: string }[],
  ) =>
    request<{
      answer: string;
      questionsRemaining: number;
      actionsAvailable: false;
    }>("/personal/ask", "POST", token, { brief, question, history }),
};
export type BusinessSetup = {
  name: string;
  category: string;
  city: string;
  language: string;
  description: string;
  goal: string;
  contact?: string;
  rules: string;
  approved: true;
};
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  skills: string[];
  character?: string;
  execution?: "model" | "cloud" | "verified_code";
};
export type Teammate = {
  id: string;
  revision: number;
  character: string;
  request: string;
  brief: string;
  state: "proposed" | "active" | "paused";
  team?: TeamMember[];
  teamIdentity?: { id: string; name: string; lead: string; character: string };
  plan: {
    name: string;
    outcome: string;
    skills: string[];
    rules: string[];
    questions: string[];
    limitations: string[];
    alternative: string | null;
    assessment: string;
  };
  feasibility: { state: string; blockers: string[]; checkedAt: string };
};
export type WorkspaceState = {
  version: number;
  brief: string;
  briefApproved: boolean;
  blueprints: Teammate[];
  business?: BusinessSetup & { onboardedAt: string };
  account?: { saved: boolean; expiresAt: string };
  paymentSetup?: {
    configured: boolean;
    mode: "staging" | "production";
    midSuffix: string;
  };
  controls?: { paused: boolean; humanTakeover: boolean };
  tasks: {
    id: string;
    blueprintId: string;
    text: string;
    state: string;
    reason?: string;
    createdAt: string;
    updatedAt: string;
    checkpoint?: {
      stages: { role: string; completedAt: string; model: string; specialistName?: string }[];
    };
    result?: {
      title: string;
      output: string;
      sources: string[];
      nextStep: string;
    };
  }[];
  connections: {
    toolkit: string;
    status: string;
    identity?: { username: string; accountType: string };
  }[];
  readiness: Record<string, boolean>;
  limits: {
    modelsRemaining: number;
    toolsRemaining: number;
    period?: string;
    resetAt?: string;
  };
  providers?: { sarvam: boolean; cognee: boolean; paytm: boolean };
  posts?: ContentPost[];
  payments?: Payment[];
  channels?: Record<
    string,
    { ready: boolean; enabled: boolean; error?: string }
  >;
  inbox?: {
    id: string;
    channel: string;
    text: string;
    reply?: string;
    reason?: string;
    state: string;
    createdAt: string;
    providerReplyId?: string;
    logRef?: string;
  }[];
  commerce?: {
    revision?: number;
    snapshotHash?: string;
    offers: Offer[];
    orders: Order[];
    hours?: CommerceHours;
    calendar?: { label: string; verifiedAt: string };
  };
  reminders?: {
    id: string;
    contactName: string;
    message: string;
    at: string;
    state: string;
    reason?: string;
    providerMessageId?: string;
  }[];
  sites?: PublishedSite[];
  whatsappSales?: WhatsAppSalesState;
  brain?: {
    shared: boolean;
    cogneeState: string;
    snapshot: {
      acceptedOrders: number;
      awaitingOwner: number;
      verifiedCollectionPaise: number;
      verifiedPayments: number;
      unpaidAcceptedOrders: number;
      reminders: { scheduled: number; sent: number };
      offers: {
        id: string;
        name: string;
        quantity: number | null;
        reorderSuggested: boolean;
        reorderAt: number;
      }[];
    };
  };
};
export type Offer = {
  id: string;
  name: string;
  kind: "product" | "appointment";
  unitPricePaise: number;
  minimumQuantity: number;
  availableQuantity: number | null;
  reorderAt?: number;
  deliveryPaise: number | null;
  durationMinutes: number;
  terms: string;
};
export type CommerceHours = {
  days: number[];
  opens: number;
  closes: number;
  noticeHours: number;
};
export type Slot = {
  id: string;
  start: string;
  end: string;
  expiresAt: string;
};
export type SiteCopy = {
  name: string;
  headline: string;
  description: string;
  sections: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
  design: {
    layout: "storefront" | "studio" | "service";
    palette: "navy" | "rose" | "mango";
    tag: string;
  };
};
export type WebsiteDesign = {
  layout: "editorial" | "catalogue" | "appointments" | "local-service";
  heroStyle: "split" | "cover" | "type-led";
  accent: string;
  ink: string;
  background: string;
  sectionOrder: string[];
  selectedAssetIds: string[];
  rationale: string;
};
export type PublishedSite = {
  id: string;
  businessName: string;
  slug: string;
  state: string;
  url: string;
  expiresAt: string;
  approvedAt?: string;
  publishedAt?: string;
  reason?: string;
  studioCheckpoint?: {
    stages: { stage: string; completedAt: string; model: string; specialistName?: string; character?: string }[];
  };
  studioPlan?: WebsiteDesign;
};
export type PublicSite = {
  slug: string;
  content: SiteCopy;
  phone?: string;
  offers: {
    name: string;
    kind: string;
    pricePaise: number;
    minimumQuantity: number;
    terms: string;
  }[];
  publishedAt: string;
  expiresAt: string;
  trial: boolean;
  studio?: WebsiteDesign;
  assets?: { id: string; alt: string; src: string }[];
};
export type Order = {
  id: string;
  offerId: string;
  name: string;
  kind: "product" | "appointment";
  quantity: number;
  unitPricePaise: number;
  deliveryPaise: number | null;
  amountPaise: number | null;
  terms: string;
  state: string;
  expiresAt: string;
  stockConfirmed: boolean;
  customerAcceptedAt?: string;
  selectedSlot?: Slot;
  calendarReceipt?: unknown;
  calendarVerified?: boolean;
  paymentState?: string;
  paymentUrl?: string;
  reason?: string;
};
export type WhatsAppState = {
  linked: boolean;
  state: string;
  canLink: boolean;
  canReconnect: boolean;
  qr?: string;
  phone?: string;
  error?: string;
  salesAutoReplyEnabled: boolean;
};
export type WhatsAppSalesSetup = {
  approved: true;
  blueprintId: string;
  language: "auto" | "en" | "hi" | "hinglish";
  tone: "friendly" | "professional";
  deliveryArea: string | null;
  discountLimitPercent: number;
  ownerHelp: string[];
  followup: {
    enabled: boolean;
    afterMinutes: number[];
    quietStart: number;
    quietEnd: number;
  };
  summary: { enabled: boolean; at: string };
};
export type WhatsAppConversation = {
  id: string;
  conversationId: string;
  recipient: string;
  customerName: string;
  speakerBlueprintId: string;
  speakerRevision: number;
  language: string;
  mode: "teammate" | "owner";
  optedOut: boolean;
  stage: "enquiry" | "quote" | "awaiting_payment" | "paid" | "owner_needed";
  orderIds: string[];
  activeOrderId?: string;
  updatedAt: string;
  reason?: string;
  history: {
    providerId?: string;
    text: string;
    at: string;
    kind: "customer" | "teammate" | "owner";
    providerMessageId?: string;
    outboxId?: string;
  }[];
};
export type WhatsAppSalesState = {
  settings?: WhatsAppSalesSetup & { revision: number; approvedAt: string };
  conversations: WhatsAppConversation[];
  outbox: {
    id: string;
    conversationId: string;
    key: string;
    kind: "reply" | "quote" | "payment_request" | "payment_confirmation" | "payment_followup" | "owner_reply";
    state: "pending" | "sending" | "sent" | "cancelled" | "uncertain" | "owner_needed";
    message: string;
    notBefore: string;
    orderId?: string;
    inboxId?: string;
    providerMessageId?: string;
    sentAt?: string;
    reason?: string;
  }[];
  digests: {
    id: string;
    date: string;
    preparedAt: string;
    verifiedPaymentCount: number;
    verifiedAmountPaise: number;
    paidOrderIds: string[];
    pendingPaymentOrderIds: string[];
    ownerNeededConversationIds: string[];
  }[];
};
export type ContentPost = {
  id: string;
  blueprintId: string;
  caption: string;
  headline: string;
  imageUrl: string;
  contentHash: string;
  state: string;
  notBefore?: number;
  permalink?: string;
  logIds: string[];
  createdAt: string;
};
export type Payment = {
  id: string;
  bookingId: string;
  orderId: string;
  amountPaise: number;
  currency: "INR";
  mode: "staging" | "production";
  state: string;
  fulfilment: string;
  url?: string;
  txnId?: string;
  verifiedAt?: string;
};
