# Awaaz premium calling preview

## Scope

- New `/awaaz` route and premium cards in Ready Teams and Connections.
- Awaaz is a paid add-on at the UI level. The native dialog explains that billing and merchant activation are not enabled in this preview. No price is invented and no payment is taken.
- No credentials, shared Connect Link, recording URL, full phone number or call API is published in the frontend.
- The decorative pixel animation does not claim a new call is happening.

## Real evidence

On 3 October 2026 the separately configured Bolna agent completed one authorized Hindi/Hinglish phone call in 59 seconds. The approved fictional order was 2 kg atta ₹120 plus 1 litre cooking oil ₹160, total ₹280. The tester's preferred pickup time was that evening at 7 pm, for owner review. No actual order, appointment or payment was created.

The transcript on this page is from that actual call. It does not simulate a new conversation. It retains imperfect transcription so the evidence is not rewritten into an idealized result.

Private operator evidence: agent `b27fd5c8-d0fb-4f34-b407-75d74ca253d0`, execution `a473db1e-8031-45bf-8c17-780630d22256`, final Composio result log `log_j2wbMGs0D91r`.

## Deployment

The side-conversation preview uses a separate Vercel project, `kaamset-awaaz-premium`. Main KaamSet production deployments are active independently; this preview does not replace them. Merge these additive frontend changes through the main release process when appropriate.

## Production work remaining

Merchant billing, entitlement checks on the server, account linking to each workspace, durable call admission/budgets, background scheduling and operational write-back. Bolna trial recipients must be verified. Publishing this UI does not grant visitors access to the pilot account or its credits.
