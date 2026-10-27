import type { Metadata } from 'next';
export const metadata: Metadata={title:'Archea Workspace',description:'Commesse, pianificazione e risorse di Studio Archea'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>}
