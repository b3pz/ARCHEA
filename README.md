# ARCHEA — IT_ARCHEA

Base del portale trasversale di Archea Associati: gestione commesse e integrazione progressiva con HR, mappe/postazioni, asset e ticket di `b3pz/Archea_IT`.

## Stato effettivo

Il modulo commesse è funzionante: attività, date manuali, risorse, duplicazione, cestino, Gantt, storico e salvataggio D1 con protezione dalle sovrascritture. La versione ospitata contiene i 99 piani importati. I dati aziendali non sono inclusi in questa repository.

I moduli HR/IT esistenti NON sono stati modificati e non sono ancora sincronizzati. Contratti condivisi e politica Reader/Writer sono preparati in `packages/core`; non sono ancora collegati alla sessione del portale esistente. Non presentare questa base come una integrazione già attiva.

## Avvio

Richiede Node 22.13 o successivo. Installare le dipendenze secondo il lockfile del progetto. Eseguire `node scripts/prepare-data.mjs` prima del build per creare l'archivio vuoto; per i dati reali utilizzare un seed privato compatibile, senza committarlo.

Il codice applicativo è in `app/`, le migrazioni D1 in `drizzle/`. Il deployment Sites richiede una propria `.openai/hosting.json` con un project_id assegnato dal servizio e binding D1 `DB`. Non inventare un project_id. Non eseguire le migrazioni D1 nel database Supabase del service desk.

`node --test packages/core/access.test.mjs` verifica la politica di accesso condivisa.

## Accessi desiderati

- Reader: consulta senza credenziali applicative, all'interno del perimetro autorizzato dello studio.
- Writer: login con account personale e abilitazione esplicita; tutte le mutazioni tracciate sul server.
- La sola presenza di un nome utente non concede scrittura. Il ruolo non può essere scelto dal browser.
- La demo Sites mantiene il gate privato ChatGPT. Il login Writer condiviso e l'accesso Reader interno senza login applicativo richiedono il collegamento all'identità aziendale/gateway.

Vedere `docs/INTEGRAZIONE.md` per le relazioni tra moduli e i passi di migrazione.

## Limiti

Calendari, vincoli, disponibilità delle persone e dipendenze non vengono ricalcolati automaticamente. Il Gantt usa le date salvate. I record importati senza risorsa nominativa non vengono collegati automaticamente a persone HR. Il backup esportabile non sostituisce una politica di backup e ripristino operativa verificata.
