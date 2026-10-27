import {api,gate,json,writer} from '../workspace/route';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!gate(req))return json({error:'Accesso al portale richiesto'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origine non valida'},403);
 try{const {email,password}=await req.json() as any;if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>1024)return json({error:'Credenziali non valide'},400);
 const r=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});if(!r.ok)return json({error:'Email o password non corrette.'},401);
 const session:any=await r.json();const check=new Request(req.url,{headers:{cookie:'archea_writer='+session.access_token}});const w=await writer(check);if(!w)return json({error:'Questo account non è autorizzato come Writer progetti.'},403);
 const cookie='archea_writer='+session.access_token+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+Math.min(session.expires_in||3600,3600);
 return json({email:w.email,role:'writer'},200,{'set-cookie':cookie});
 }catch{return json({error:'Accesso non disponibile. Riprova.'},503)}
}
export async function DELETE(req:Request){if(!gate(req))return json({error:'Accesso richiesto'},401);if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origine non valida'},403);return json({role:'reader'},200,{'set-cookie':'archea_writer=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'})}
