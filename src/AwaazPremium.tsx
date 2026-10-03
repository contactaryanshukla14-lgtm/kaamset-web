import {ArrowRight, ArrowUpRight, Check, Crown, Phone, ShieldCheck} from 'lucide-react';
import {UiText} from './Language';
import './awaaz.css';

export function AwaazPremiumCard({connection=false}:{connection?:boolean}) {
  return <a href="/awaaz" className={`awaaz-premium-card ${connection?'awaaz-connection-card':''}`}>
    <span className="awaaz-card-icon"><Phone size={23}/></span>
    <span className="awaaz-card-content"><span className="awaaz-badge"><Crown size={12}/><UiText text="Premium calling"/></span><strong>Awaaz <span><UiText text="Your calling teammate"/></span></strong><p><UiText text="Confirm orders and capture customer preferences in Hindi/Hinglish. See the real, completed Bolna pilot."/></p><small><Check size={13}/><UiText text="Live voice test verified · Paid add-on"/></small></span>
    <span className="awaaz-card-arrow"><ArrowRight size={19}/></span>
  </a>;
}

export function AwaazConnectionCard(){return <article className="office-card"><span className="office-app-icon"><Phone size={24}/></span><span className="awaaz-badge"><Crown size={12}/><UiText text="Premium"/></span><h3>Bolna · Awaaz</h3><p><UiText text="Your calling teammate. Connect a merchant-owned Bolna account after premium activation; calling uses provider credits."/></p><span className="office-status"><ShieldCheck size={14}/><UiText text="Pilot verified · Premium setup preview"/></span><div className="office-actions"><a href="/awaaz" className="office-secondary"><UiText text="View premium calling"/><ArrowUpRight size={14}/></a></div></article>;}
