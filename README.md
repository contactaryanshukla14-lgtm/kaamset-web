# KaamSet web

Standalone React/Vite frontend for the KaamSet fictional service-merchant hackathon demonstration.

Public URL: <https://kaamset-web.vercel.app>

The frontend connects to the shared Foundation API at `VITE_KAAMSET_API_URL`. The default is the deployed Railway API. No provider credentials, connected-account IDs, tenant IDs or platform administrator tokens are shipped to the browser. A server-issued guest token stays in `sessionStorage` and expires after 24 hours. The API enforces the exact public origin and scopes the token to the fictional demonstration namespace.

## Run locally

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` only if using another API origin. The API must permit that origin. `npm run build` checks TypeScript and produces static assets for Vercel.

## Judge path

1. Choose **Try the AI team** and launch Aamchi Appliance Care.
2. Ask about an AC that is not cooling in Andheri; check the quoted visit price and scope.
3. Request an appointment tomorrow after 4 PM and ask to continue in Marathi.
4. Select a numbered live opening. Switch to the merchant workbench to see Calendar and Sheet confirmation.
5. Ask to move the appointment one hour later and check that the event ID is unchanged.

The businesses and customers are fictional. Calendar and Sheet actions use dedicated demo resources. Payment integration is not connected. Provider actions are labelled confirmed only after readback; unresolved writes remain pending verification.

More detail: [pitch and demo](docs/PITCH_AND_DEMO.md), [architecture](docs/ARCHITECTURE.md), [verification](docs/TEST_RESULTS.md), and [work provenance](docs/PROVENANCE.md).
