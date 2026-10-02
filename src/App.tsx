import { lazy, Suspense } from "react";
import MerchantOffice from "./MerchantOffice";
const BusinessWebsite = lazy(() => import("./BusinessWebsite"));
const CustomerOrder = lazy(() => import("./CustomerOrder"));
const Demo = lazy(() => import("./DemoApp"));
export default function App() {
  const slug = /^\/business\/([a-z0-9-]{1,60})\/?$/.exec(
    window.location.pathname,
  )?.[1];
  const order = new URLSearchParams(window.location.search).get("order");
  return (
    <Suspense
      fallback={<main className="office-loading">Opening KaamSet…</main>}
    >
      {slug ? (
        <BusinessWebsite slug={slug} />
      ) : order ? (
        <CustomerOrder cap={order} />
      ) : window.location.pathname === "/demo" ? (
        <Demo />
      ) : (
        <MerchantOffice />
      )}
    </Suspense>
  );
}
