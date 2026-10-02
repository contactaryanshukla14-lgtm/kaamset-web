# KaamSet — Your business. Your AI team.

React/Vite owner workspace for Indian businesses: basic setup, named ready teammates, counter/khata/shop/customer/Instagram/website/assistant desks, approved knowledge and merchant-owned app connections.

Public domain: [kaamset-web.vercel.app](https://kaamset-web.vercel.app).

## Owner flow

Enter your business, approve a short business brief, and choose a ready teammate. Review its saved job and required connections before activation. Custom teammate creation is removed from the merchant interface. Live channel actions start disabled; enabling them requires the relevant connections and a new approval. Saved cloud work continues after leaving the page. Verify your email to recover the workspace on another device; sign-in, password recovery and server logout use revocable Foundation identity sessions.

Vijay coordinates asset review, design and Pro HIGH writing before publishing a safe business website. Owners supply approved photos; no automatic image search/generation is claimed. Sales, Instagram and reminder desks retain their explicit approval and external-verification requirements.

Paytm setup is available under Connections and Orders & payments after saving the business account. Merchant credentials are encrypted on the API, never bundled here. Test and production modes are separate. A payment is collected only after signed server verification; Paytm merchant credentials/activation are still needed for a real provider payment.

**Aarav's customer team** combines paired-account setup, inline Paytm connection and approved reply/follow-up rules. Aarav is the customer voice; Meera prepares quotes, Naman checks payment evidence, Milan follows approved reminder timing and Nisha reviews internal drafts. The desk shows conversation stages, orders, delivery receipts, payment evidence, takeover and daily in-app summaries. Catalogue editing preserves unsaved changes and requires fresh review after stock changes.

**Merchant desks:** Arjun interprets text, barcodes, photos and speech into editable catalogue matches; owners review quantities and collection method. Tara publishes a scoped pickup storefront. Naina records credit sales and explicit offline repayments. Naman shows recorded collections, outstanding credit and expenses. Kabir records requests against this shop's catalogue; Ira prepares insights from actual unmet requests. Sia answers grounded business questions. These run through saved workspace records and the existing specialist/reviewer cloud task queue.

**Existing UPI QR:** Connections can save an authorised original payment QR and recipient details in a verified owner workspace. UPI bills freeze the destination, present a public receipt and require explicit owner confirmation of receipt. This works without a Paytm API MID; it does not provide bank visibility or automatic Paytm verification. Payment details and QR images are never embedded in the frontend bundle or copied by teammate sharing.

The older fictional booking workflow is retained at `/demo`. Existing pitch and hackathon notes refer to that workflow; they do not define the default merchant product.

## Development

```sh
npm ci
npm run dev
npm run build
```

Production uses the Railway Foundation service by default. Set `VITE_KAAMSET_API_URL` for a different production API. Development defaults to the isolated local backend at `http://127.0.0.1:3001`; `KAAMSET_LOCAL_API_URL` can override it. Never place server provider credentials in frontend variables.

This owner release requires backend migrations 055–056 and the matching API/worker release. See [merchant implementation and setup](https://github.com/contactaryanshukla14-lgtm/brainforge-backend/blob/master/docs/KAAMSET-MERCHANT-PRODUCT.md).

Guest workspaces expire after 24 hours. Saved early-access workspaces have bounded daily usage. Subscription billing and arbitrary execution across every app in an integration catalogue are outside this release.

The ready merchant desks additionally require the matching backend ready-team/merchant-operations release. Do not promote this frontend over an older API. See the backend `docs/KAAMSET-READY-MERCHANT-TEAMS.md` for scope, payment setup and acceptance checks.

### 3 October 2026 ready-team checks

Configured-provider checks in an isolated PostgreSQL/Redis workspace completed Hinglish billing (₹240), photo intake (₹180 reviewed preview), barcode matching, browser microphone capture → actual Sarvam transcription, scoped shop checkout, credit/partial repayment and a real Sia + Nisha task after browser closure. Reopening the selected teammate showed the persisted result. Original QR setup reopened correctly; unpaid fixture cancellation restored reserved stock. No real payment was made and no live WhatsApp/Instagram send is claimed.

Desktop and 390px phone screens were inspected with keyboard/modal and reduced-motion checks. Larger channel desks and Rive load on demand; polling slows when idle and pauses while hidden. In the measured fixture, workspace refresh fell from roughly 520 KB to 39 KB after removing repeated payment images and private model drafts. Initial production JavaScript fell from 431.81 KB to approximately 389 KB (before gzip). These are fixture/build measurements, not a production latency guarantee.

## Verification

Production TypeScript/Vite builds pass. Real-provider browser checks completed three-step onboarding, team creation/activation, specialist/reviewer work after leaving the page, and three-stage website generation/publication. Desktop and phone layouts/navigation were inspected; screenshots are in `docs/screenshots`.

The Saathi release adds actual configured-model builder and UI rule-save checks with fictional bakery data, and desktop/phone checks at 1280/375 widths. Its backend passes 2,530 unit tests and nine isolated database journeys. Automated WhatsApp/Paytm journey responses are controlled fixtures; a merchant-owned WhatsApp pairing and Paytm test payment remain required for genuine provider proof. See [sales implementation and limits](https://github.com/contactaryanshukla14-lgtm/brainforge-backend/blob/master/docs/KAAMSET-WHATSAPP-SALES.md).
