# Collegamento trasversale IT_ARCHEA

## Fonti effettivamente verificate

Repository `b3pz/Archea_IT`, `README_V6_0_3.md`, `README_V8_1.md`, frontend `app.js` (lettura 27 ottobre 2026).

Il portale esistente usa Supabase come master, tabella `people` con `id`, `display_name`, `corporate_email`, `site`, `current_status`; valori `reference_values` con `value_type=SITE` e `is_approved=true`; `person_events` per i movimenti. HR e IT hanno già permessi specifici. Il codice del portale è pubblico, i dati operativi non devono esserlo.

## Dati comuni

| Dato | Fonte autorevole | Regola |
|---|---|---|
| Persona | `people.id` Supabase | Identificatore stabile, mai nome libero come chiave |
| Sede | `reference_values` SITE approvati | Usare valori controllati; confermare ID persistenti prima della migrazione |
| Asset | Modulo censimento esistente | Verificare schema e ID nel database prima del collegamento |
| Postazione e mappa | Modulo mappe esistente | Conservare identificatori e geometrie esistenti |
| Commessa e attività | Nuovo modulo progetti | Aggiungere relazioni verso gli ID master |
| Ticket | Service desk esistente | Aggiungere contesto commessa/postazione senza duplicare il ticket |

## Esempi di flussi da implementare

1. Scheda persona: mostrare commesse assegnate, postazione, device e ticket usando lo stesso `personId`.
2. Spostamento HR confermato: aggiornare la postazione secondo il workflow già esistente; non riassegnare automaticamente commesse né dichiarare disponibile un device.
3. Ticket aperto da una mappa: precompilare persona, asset e postazione; la commessa resta facoltativa.
4. Scheda commessa: mostrare persone collegate al master, con collegamenti autorizzati alle altre sezioni.
5. Uscita: segnalare attività da riassegnare, senza cancellare lo storico.

## Reader / Writer

Reader è una modalità di sola lettura, senza account applicativo nel portale interno; non equivale a pubblicare dati su Internet. Writer richiede identità verificata e ruolo assegnato server-side. La lettura di informazioni HR riservate resta limitata al proprio ambito; il Reader generale non acquisisce automaticamente accesso completo a HR.

Non modificare i ruoli HR, IT e SUPER_IT del portale esistente: Reader/Writer definiscono le operazioni del nuovo modulo e devono essere mappati ai permessi esistenti con una matrice esplicita. Un Writer commesse non diventa amministratore HR.

`packages/core/access.mjs` contiene la politica verificabile. `trustedInternalAccess` deve essere calcolato esclusivamente da middleware server autenticato (gateway aziendale, rete autorizzata o accesso Sites), mai inviato dal client come prova di accesso. La UI può nascondere i pulsanti, ma il server deve comunque respingere ogni scrittura Reader.

## Sequenza concreta

1. Verificare schema Supabase/RLS e login esistenti; esportare schema senza dati o segreti.
2. Approvare il perimetro Reader e i campi leggibili in ogni modulo.
3. Creare schema commesse e relazioni separato in Supabase oppure adapter server privato; eseguire migrazione di prova con confronto conteggi e backup ripristinabile.
4. Collegare manualmente le risorse importate a `people.id`; proporre candidati per email, senza unire omonimi automaticamente.
5. Collegare i moduli alla stessa sessione e ai controlli Reader/Writer.
6. Provare flussi trasversali con utenti reali e autorizzazioni limitate; poi attivare la navigazione comune.

Il modulo commesse usa ora Supabase (vedi DEPLOYMENT.md). Le relazioni trasversali con HR, ticket, asset e mappe sono ancora da implementare. Lo schema effettivo usa `people.id` bigint, non UUID.
