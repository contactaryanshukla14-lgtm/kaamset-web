import { lazy, Suspense } from "react";
import MerchantOffice from "./MerchantOffice";
const BusinessWebsite = lazy(() => import("./BusinessWebsite"));
const CustomerOrder = lazy(() => import("./CustomerOrder"));
const ShopFront = lazy(() => import("./ShopFront"));
const Demo = lazy(() => import("./DemoApp"));
const MerchantLab = lazy(() => import("./MerchantLabContainer"));
const Awaaz = lazy(() => import("./Awaaz"));
export default function App() {
  const slug = /^\/business\/([a-z0-9-]{1,60})\/?$/.exec(
    window.location.pathname,
  )?.[1];
  const query=new URLSearchParams(window.location.search),shop=query.get("shop"),receipt=query.get("receipt");
  const order = new URLSearchParams(window.location.search).get("order");
  return (
    <Suspense
      fallback={<main className="office-loading">Opening KaamSet…</main>}
    >
      {window.location.pathname.replace(/\/$/,'') === '/awaaz' ? <Awaaz/> : window.location.pathname === '/merchant-lab'||query.get('merchantLab')==='1'&&!localStorage.getItem('kaamset_lab_token') ? <MerchantLab/> : shop||receipt ? (<ShopFront cap={(shop||receipt)!} receipt={!!receipt}/>) : slug ? (
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
