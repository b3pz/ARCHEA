# ARCHEA Workspace — Supabase

Il sito operativo usa un backend Cloudflare Workers/Sites e il database Supabase di lavoro. GitHub Pages da solo non può custodire il segreto di lettura interno: non distribuire il segreto nel frontend.

## Accesso

Il perimetro Sites resta privato. All'interno del perimetro la modalità iniziale Reader non richiede un secondo login applicativo. Writer usa email e password del proprio account Supabase, con ruolo assegnato nella tabella `archea_project_writers`. Solo Giuseppe è stato abilitato inizialmente. Nessuna modifica ai ruoli HR/IT.

La sessione Writer è un cookie HttpOnly, Secure, SameSite=Strict, valido al massimo un'ora. Alla scadenza occorre accedere di nuovo. La password viene trasmessa a Supabase per il login e non salvata dall'app. Le scritture ricontrollano identità e ruolo a ogni richiesta.

I Reader ricevono soltanto commesse dello studio non eliminate. I progetti personali sono visibili solo al Writer proprietario; il cestino e lo storico richiedono Writer. Reader non può scrivere né attraverso l'API del sito né direttamente nel database.

## Configurazione server

Configurare come segreti runtime `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ARCHEA_READER_SECRET`. Il database conserva solo l'hash SHA-256 del segreto Reader nella policy; generare 32 byte casuali e sostituire `READER_HASH` nello schema prima dell'applicazione. Il segreto deve restare sul server e ruotato insieme alla policy.

`database/workspace.sql` descrive lo schema iniziale isolato. È già applicato al progetto di lavoro; non rieseguirlo sul database corrente. Le tabelle originali restano separate.

## Concorrenza e storico

Ogni salvataggio modifica una singola commessa con confronto della revisione. Un salvataggio obsoleto viene rifiutato: aggiornare prima di riprovare. Un trigger incrementa la revisione e registra autore, azione e data nella stessa transazione. I colleghi vedono le modifiche dopo Aggiorna; non è ancora presente sincronizzazione automatica realtime. Il calendario rimane manuale.

## Migrazione verificata

99 progetti, 5.515 righe attività, 1.565 risorse nei singoli piani, 6.424 assegnazioni. Il database D1 live è stato controllato prima del passaggio: nessuna commessa modificata e nessuno storico da recuperare. I dati MPP non sono inclusi nel repository. Le risorse importate non sono ancora associate automaticamente alle persone HR.

## Verifiche

TypeScript e build; test SQL transazionali con rollback: anonimo senza segreto non vede commesse, account non autorizzato non vede commesse, Writer può inserire/aggiornare e genera audit; revisioni incrementate. Il controllo di sicurezza Supabase non segnala il nuovo modulo; restano avvisi su funzioni SECURITY DEFINER preesistenti e protezione password dell'Auth, da valutare separatamente: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
