export type ConnectionProblem='authorization_denied'|'authorization_expired'|'authorization_failed'|'account_disabled';

export function connectionProblemMessage(problem?:ConnectionProblem){
  switch(problem){
    case 'authorization_denied':return 'Access was declined. Start fresh and complete the account permission screen.';
    case 'authorization_expired':return 'This sign-in link expired. Start fresh to get a new connection link.';
    case 'authorization_failed':return 'The account connection did not finish. Start fresh, or check the connection if you already completed sign-in.';
    case 'account_disabled':return 'This account connection is disabled or revoked. Reconnect your account to use it.';
    default:return '';
  }
}

export function needsFreshConnection(connection?:{status:string;authorizationCreatedAt?:string},now=Date.now()){
  if(!connection)return false;
  if(connection.status==='needs_attention')return true;
  if(connection.status!=='pending')return false;
  const createdAt=Date.parse(connection.authorizationCreatedAt||'');
  return !Number.isFinite(createdAt)||now-createdAt>=10*60*1000;
}
