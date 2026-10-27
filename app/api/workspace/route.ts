import {env} from 'cloudflare:workers';
import seed from '../../data/seed.json';
export const dynamic='force-dynamic';
function json(v:unknown,status=200){return Response.json(v,{status,headers:{'cache-control':'no-store'}})}
function allowed(req:Request){return req.headers.get('oai-authenticated-user-id') || (process.env.NODE_ENV!=='production'?'preview':null)}
export async function GET(req:Request){
 if(!allowed(req))return json({error:'Accesso richiesto'},401);
 try{
 const rows=await env.DB!.prepare('SELECT id,payload,revision FROM projects').all();
 const data:any=structuredClone(seed);data.revisions={};
 for(const row of rows.results as any[]){const b=JSON.parse(row.payload);data.projects=data.projects.filter((p:any)=>p.id!==row.id);data.tasks=data.tasks.filter((t:any)=>t.pid!==row.id);data.resources=data.resources.filter((r:any)=>r.pid!==row.id);data.assignments=data.assignments.filter((a:any)=>a.pid!==row.id);data.projects.push(b.project);data.tasks.push(...b.tasks);data.resources.push(...b.resources);data.assignments.push(...b.assignments);data.revisions[row.id]=row.revision}
 const logs=await env.DB!.prepare('SELECT * FROM audit ORDER BY created_at DESC LIMIT 150').all();data.history=logs.results;return json(data);
 }catch(e){console.error(e);return json({error:'Archivio non disponibile. Nessuna modifica è stata applicata.'},503)}
}
export async function POST(req:Request){
 const actor=allowed(req);if(!actor)return json({error:'Accesso richiesto'},401);
 if(req.headers.get('origin') && req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origine non valida'},403);
 try{
 const body:any=await req.json(),b=body.bundle,expected=body.revision;
 if(!b||!b.project||!Number.isSafeInteger(b.project.id)||!Array.isArray(b.tasks)||!Array.isArray(b.resources)||!Array.isArray(b.assignments)||!Number.isInteger(expected)||expected<0||typeof b.project.name!=='string'||!b.project.name.trim())return json({error:'Dati non validi'},400);
 const id=b.project.id;if(b.tasks.some((t:any)=>t.pid!==id)||b.resources.some((r:any)=>r.pid!==id)||b.assignments.some((a:any)=>a.pid!==id))return json({error:'Riferimenti non validi'},400);
 const payload=JSON.stringify(b);if(payload.length>1500000)return json({error:'Commessa troppo grande'},413);
 const now=new Date().toISOString();let result;
 if(expected===0)result=await env.DB!.prepare('INSERT OR IGNORE INTO projects(id,payload,revision,updated_at,actor) VALUES(?,?,?,?,?)').bind(id,payload,1,now,actor).run();
 else result=await env.DB!.prepare('UPDATE projects SET payload=?,revision=revision+1,updated_at=?,actor=? WHERE id=? AND revision=?').bind(payload,now,actor,id,expected).run();
 if(!result.meta.changes)return json({error:'La commessa è stata modificata in un’altra sessione. Ricarica prima di riprovare.'},409);
 const action=String(body.action||'Modifica commessa').slice(0,200);
 try{await env.DB!.prepare('INSERT INTO audit(id,project_id,action,actor,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,action,actor,now).run()}catch(auditError){console.error('Audit write failed',auditError)}
 return json({revision:expected+1});
 }catch(e){console.error(e);return json({error:'Salvataggio non riuscito. Mantieni aperta la pagina e riprova.'},500)}
}
