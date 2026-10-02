# KaamSet — Your business. Your AI team.

React/Vite owner workspace for Indian businesses: basic setup, natural-language team creation, customer/Instagram/website/assistant desks, approved knowledge, shared teammate recipes and merchant-owned app connections.

Public domain: [kaamset-web.vercel.app](https://kaamset-web.vercel.app).

## Owner flow

Enter your business, approve a short business brief, and describe the first job. Review the AI team proposal and any required connections before activation. Saved cloud work continues after leaving the page. Verify your email to recover the workspace on another device; sign-in, password recovery and server logout use revocable Foundation identity sessions.

Vijay coordinates asset review, design and Pro HIGH writing before publishing a safe business website. Owners supply approved photos; no automatic image search/generation is claimed. Sales, Instagram and reminder desks retain their explicit approval and external-verification requirements.

Paytm setup is available under Connections and Orders & payments after saving the business account. Merchant credentials are encrypted on the API, never bundled here. Test and production modes are separate. A payment is collected only after signed server verification; Paytm merchant credentials/activation are still needed for a real provider payment.

**WhatsApp · Saathi** combines paired-account setup, inline Paytm connection and approved reply/follow-up rules. Tara is the customer voice; Milo prepares quotes, Chotu checks payment evidence, Milan follows approved reminder timing and Nisha reviews internal drafts. The desk shows conversation stages, orders, delivery receipts, payment evidence, takeover and daily in-app summaries. Catalogue editing preserves unsaved changes and requires fresh review after stock changes.

The older fictional booking workflow is retained at `/demo`. Existing pitch and hackathon notes refer to that workflow; they do not define the default merchant product.

## Development

```sh
npm ci
npm run dev
npm run build
```

The API defaults to the Railway Foundation service. Set `VITE_KAAMSET_API_URL` for a different production API. The development proxy can use `KAAMSET_LOCAL_API_URL` for an isolated local backend. Never place server provider credentials in frontend variables.

This owner release requires backend migrations 055–056 and the matching API/worker release. See [merchant implementation and setup](https://github.com/contactaryanshukla14-lgtm/brainforge-backend/blob/master/docs/KAAMSET-MERCHANT-PRODUCT.md).

Guest workspaces expire after 24 hours. Saved early-access workspaces have bounded daily usage. Subscription billing and arbitrary execution across every app in an integration catalogue are outside this release.

## Verification

Production TypeScript/Vite builds pass. Real-provider browser checks completed three-step onboarding, team creation/activation, specialist/reviewer work after leaving the page, and three-stage website generation/publication. Desktop and phone layouts/navigation were inspected; screenshots are in `docs/screenshots`.

The Saathi release adds actual configured-model builder and UI rule-save checks with fictional bakery data, and desktop/phone checks at 1280/375 widths. Its backend passes 2,530 unit tests and nine isolated database journeys. Automated WhatsApp/Paytm journey responses are controlled fixtures; a merchant-owned WhatsApp pairing and Paytm test payment remain required for genuine provider proof. See [sales implementation and limits](https://github.com/contactaryanshukla14-lgtm/brainforge-backend/blob/master/docs/KAAMSET-WHATSAPP-SALES.md).
