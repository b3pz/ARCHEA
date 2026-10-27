import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
type Config={SUPABASE_URL:string,SUPABASE_PUBLISHABLE_KEY:string,ARCHEA_READER_SECRET:string};
export function config(){return env as unknown as Config}
export function json(v:unknown,status=200,headers:Record<string,string>={}){return Response.json(v,{status,headers:{'cache-control':'no-store',...headers}})}
export function gate(req:Request){return !!req.headers.get('oai-authenticated-user-id') || process.env.NODE_ENV!=='production'}
export function token(req:Request){return req.headers.get('cookie')?.match(/(?:^|;\s*)archea_writer=([^;]+)/)?.[1]||''}
export async function api(path:string,init:RequestInit={},jwt='',reader=false){const c=config();return fetch(c.SUPABASE_URL+path,{...init,headers:{apikey:c.SUPABASE_PUBLISHABLE_KEY,...(jwt?{Authorization:'Bearer '+jwt}:{}),...(reader?{'x-archea-reader':c.ARCHEA_READER_SECRET}:{}),'content-type':'application/json',...init.headers}})}
export async function writer(req:Request){const jwt=token(req);if(!jwt)return null;const u=await api('/auth/v1/user',{},jwt);if(!u.ok)return null;const user:any=await u.json();const r=await api('/rest/v1/archea_project_writers?select=user_id&user_id=eq.'+encodeURIComponent(user.id),{},jwt);if(!r.ok||!(await r.json() as any[]).length)return null;return {id:user.id,email:user.email,jwt}}
export async function GET(req:Request){
 if(!gate(req))return json({error:'Accesso al portale richiesto'},401);
 try{const w=await writer(req);let rows:any[]=[];
 for(let offset=0;;offset+=500){const r=await api('/rest/v1/archea_projects?select=id,payload,revision&order=id&offset='+offset+'&limit=500',{},w?.jwt||'',!w);if(!r.ok)throw Error('Database unavailable');const page:any[]=await r.json();rows.push(...page);if(page.length<500)break}
 const data:any={projects:[],tasks:[],resources:[],assignments:[],history:[],revisions:{},access:{role:w?'writer':'reader',email:w?.email||null},version:2};
 for(const row of rows){const b=row.payload;data.projects.push(b.project);for(const k of ['tasks','resources','assignments'])data[k].push(...b[k]);data.revisions[row.id]=row.revision}
 if(w){const r=await api('/rest/v1/archea_project_audit?select=*&order=created_at.desc&limit=150',{},w.jwt);if(r.ok)data.history=await r.json()}
 return json(data);
 }catch(e){console.error('Workspace read failed',e);return json({error:'Archivio non disponibile. Riprova fra poco.'},503)}
}
export async function POST(req:Request){
 if(!gate(req))return json({error:'Accesso al portale richiesto'},401);
 if(req.headers.get('origin') && req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origine non valida'},403);
 try{const w=await writer(req);if(!w)return json({error:'Sei in sola lettura. Accedi con un account Writer autorizzato.'},403);
 const raw=await req.text();if(raw.length>1500000)return json({error:'Commessa troppo grande'},413);
 const body=JSON.parse(raw),b=body.bundle,expected=body.revision;
 if(!b?.project||!Number.isSafeInteger(b.project.id)||b.project.id<=0||!Array.isArray(b.tasks)||!Array.isArray(b.resources)||!Array.isArray(b.assignments)||!Number.isInteger(expected)||expected<0||typeof b.project.name!=='string'||!b.project.name.trim())return json({error:'Dati non validi'},400);
 const id=b.project.id;if(['tasks','resources','assignments'].some(k=>b[k].some((t:any)=>t.pid!==id)))return json({error:'Riferimenti non validi'},400);
 const value:any={payload:b,action:String(body.action||'Modifica commessa').slice(0,200)};
 if(expected===0){value.id=id;value.owner_id=w.id}
 const r=await api('/rest/v1/archea_projects'+(expected?'?id=eq.'+id+'&revision=eq.'+expected:''),{method:expected?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(value)},w.jwt);
 if(r.status===409)return json({error:'La commessa esiste già. Aggiorna la pagina.'},409);
 if(!r.ok)return json({error:'Salvataggio non riuscito. Controlla l’accesso Writer e riprova.'},r.status===403?403:500);
 const rows:any[]=await r.json();if(!rows.length)return json({error:'La commessa è stata modificata da un collega. Aggiorna prima di riprovare.'},409);
 return json({revision:rows[0].revision});
 }catch{return json({error:'Salvataggio non riuscito. La modifica non è stata confermata.'},500)}
}
