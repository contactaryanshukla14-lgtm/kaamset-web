import {Brain,Cloud,ShieldCheck} from 'lucide-react';
import type {Teammate,WorkspaceState} from './api';
import PixelTeammate from './PixelTeammate';
import {memberCharacter} from './team-identity';
import {crewNames} from './crew-names';

export default function TeamIdentity({team,workspace}:{team:Teammate;workspace:WorkspaceState}){
  const members=team.team||[],tasks=workspace.tasks.filter(t=>t.blueprintId===team.id),completed=tasks.filter(t=>t.state==='completed').length,waiting=tasks.filter(t=>['failed','waiting_owner'].includes(t.state)).length;
  return <section className="team-identity-strip" aria-label="Team identity and actual work">
    <div className="team-identity-top"><span className="team-crew-name">{crewNames[team.presetId||'']||'Your AI team'}</span><span><Cloud size={13}/> Cloud workspace</span></div>
    <div className="team-role-row">{members.map(m=><div className="team-role-person" key={m.id}><PixelTeammate id={memberCharacter(m)} name={m.name}/><div><strong>{m.name}</strong><small>{m.execution==='verified_code'?'Verified code checks':m.execution==='cloud'?'Connected workflow':m.id==='nisha'?'Draft review':m.name===team.teamIdentity?.lead?'Team lead':m.role}</small></div></div>)}</div>
    <div className="team-identity-bottom"><span><Brain size={13}/> Shared business facts</span><span><ShieldCheck size={13}/> {completed} reviewed results</span>{waiting>0&&<span className="team-attention">{waiting} jobs need attention</span>}</div>
  </section>;
}
