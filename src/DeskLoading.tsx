import {UiText} from './Language';
export default function DeskLoading({label="Opening your merchant desk"}:{label?:string}) {
  return <section className="office-desk-loading" role="status" aria-label={label} aria-busy="true">
    <span className="office-eyebrow"><UiText text={"YOUR CLOUD WORKSPACE"}/></span>
    <p>{label}…</p>
    <div className="desk-skeleton desk-skeleton-hero" aria-hidden="true" />
    <div className="desk-skeleton-grid" aria-hidden="true"><div className="desk-skeleton"/><div className="desk-skeleton"/></div>
  </section>;
}
