# ARCHEA — IT_ARCHEA

Workspace per le commesse di Archea Associati: progetti, attività, calendario manuale, persone importate, cestino e storico.

Backend Sites/Cloudflare Workers, database Supabase aziendale, Reader in sola lettura e Writer con account di lavoro autorizzato. Il sito resta privato; GitHub Pages da solo non ospita il backend.

Consultare [configurazione e verifiche](docs/DEPLOYMENT.md). I dati dello studio e i file MPP sono esclusi dal repository. Per avviare il sorgente pulito eseguire `npm run prepare:data`, installare le dipendenze e configurare i segreti runtime. Non inserire chiavi privilegiate o segreti nel frontend.
