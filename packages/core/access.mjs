/** Accesso comune ai moduli di IT_ARCHEA.
 * Il gateway interno deve essere verificato dal server, mai dal browser.
 * Reader non richiede un account applicativo. Writer richiede identità e abilitazione.
 */
export function resolveAccess({ trustedInternalAccess=false, userId=null, assignedRole=null }={}) {
  if (!trustedInternalAccess) return Object.freeze({role:null,userId:null,canRead:false,canWrite:false});
  const writer=Boolean(userId && assignedRole==='writer');
  return Object.freeze({role:writer?'writer':'reader',userId:userId||null,canRead:true,canWrite:writer});
}
export function requireRead(context) {
  const access=resolveAccess(context);
  if(!access.canRead)throw Object.assign(new Error('Accesso al portale interno richiesto'),{status:403});
  return access;
}
export function requireWrite(context) {
  const access=requireRead(context);
  if(!access.canWrite)throw Object.assign(new Error('Accedi con un account Writer per modificare'),{status:401});
  return access;
}
