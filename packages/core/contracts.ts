/** Gli ID di persone e valori controllati provengono dal master Supabase esistente. */
export type ApplicationRole='reader'|'writer';
export type UUID=string;
export interface PersonRef { personId:UUID; displayName:string; corporateEmail:string|null; site:string|null }
export interface ProjectPersonLink { projectId:string; importedResourceId:string; personId:UUID|null; matchStatus:'unmatched'|'reviewed'; reviewedBy:UUID|null }
export interface CrossModuleContext { personId?:UUID; projectId?:string; assetId?:UUID; workstationId?:UUID; ticketId?:UUID; site?:string }
export interface StudioEvent { id:UUID; module:'hr'|'maps'|'tickets'|'projects'; entityId:string; action:string; actorId:UUID; occurredAt:string; context:CrossModuleContext }
