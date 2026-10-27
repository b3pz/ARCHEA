import {api,json} from '../workspace/route';
export const dynamic='force-dynamic';
// The hosted private access boundary protects this endpoint, including service callers.
// It returns no records or credentials.
export async function GET(){try{const r=await api('/rest/v1/archea_projects?select=id&limit=1',{},'',true);if(!r.ok)return json({ready:false},503);const rows=await r.json() as any[];return json({ready:rows.length>0},rows.length?200:503)}catch{return json({ready:false},503)}}
