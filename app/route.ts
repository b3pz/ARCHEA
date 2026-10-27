import { html } from './ui';
export const dynamic='force-dynamic';
export async function GET(){return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
