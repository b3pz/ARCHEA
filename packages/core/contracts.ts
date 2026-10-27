/** Gli ID di persone e valori controllati provengono dal master Supabase esistente. */
export type ApplicationRole='reader'|'writer';
export type UUID=string;
export interface PersonRef { personId:number; displayName:string; corporateEmail:string|null; site:string|null }
export interface ProjectPersonLink { projectId:string; importedResourceId:string; personId:number|null; matchStatus:'unmatched'|'reviewed'; reviewedBy:UUID|null }
export interface CrossModuleContext { personId?:number; projectId?:string; assetId?:number; workstationId?:number; ticketId?:number; site?:string }
export interface StudioEvent { id:UUID; module:'hr'|'maps'|'tickets'|'projects'; entityId:string; action:string; actorId:UUID; occurredAt:string; context:CrossModuleContext }
