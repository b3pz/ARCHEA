-- Isolated project module. Reader secret is installed as a hash by deployment tooling.
create schema if not exists archea_private;
revoke all on schema archea_private from public;
create table public.archea_project_writers(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.archea_project_writers enable row level security;
revoke all on public.archea_project_writers from anon,authenticated;
grant select on public.archea_project_writers to authenticated;
create policy writer_self on public.archea_project_writers for select to authenticated using(user_id=(select auth.uid()));
create table public.archea_projects(
 id bigint primary key check(id>0 and id<=9007199254740991),
 payload jsonb not null,
 revision integer not null default 1 check(revision>0),
 owner_id uuid references auth.users(id),
 action text not null default 'Modifica commessa',
 updated_at timestamptz not null default now(),
 check(jsonb_typeof(payload->'project')='object' and (payload->'project'->>'id')::bigint=id),
 check(jsonb_typeof(payload->'tasks')='array' and jsonb_typeof(payload->'resources')='array' and jsonb_typeof(payload->'assignments')='array'),
 check(length(trim(payload->'project'->>'name'))>0),
 check(octet_length(payload::text)<2000000)
);
alter table public.archea_projects enable row level security;
revoke all on public.archea_projects from anon,authenticated;
grant select on public.archea_projects to anon,authenticated;
grant insert(id,payload,owner_id,action),update(payload,action) on public.archea_projects to authenticated;
create policy project_reader on public.archea_projects for select to anon,authenticated using(
 encode(sha256(convert_to(coalesce(current_setting('request.headers',true)::json->>'x-archea-reader',''),'UTF8')),'hex')='READER_HASH'
 and coalesce(payload->'project'->>'scope','')<>'Personale' and not coalesce((payload->'project'->>'deleted')::boolean,false)
);
create policy project_writer_read on public.archea_projects for select to authenticated using(
 exists(select 1 from public.archea_project_writers where user_id=(select auth.uid())) and (coalesce(payload->'project'->>'scope','')<>'Personale' or owner_id=(select auth.uid()))
);
create policy project_writer_insert on public.archea_projects for insert to authenticated with check(
 exists(select 1 from public.archea_project_writers where user_id=(select auth.uid())) and owner_id=(select auth.uid())
);
create policy project_writer_update on public.archea_projects for update to authenticated using(
 exists(select 1 from public.archea_project_writers where user_id=(select auth.uid())) and (coalesce(payload->'project'->>'scope','')<>'Personale' or owner_id=(select auth.uid()))
) with check(
 exists(select 1 from public.archea_project_writers where user_id=(select auth.uid())) and (coalesce(payload->'project'->>'scope','')<>'Personale' or owner_id=(select auth.uid()))
);
create table public.archea_project_audit(id uuid primary key default gen_random_uuid(),project_id bigint not null references public.archea_projects(id),action text not null,actor uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.archea_project_audit enable row level security;
revoke all on public.archea_project_audit from anon,authenticated;
grant select on public.archea_project_audit to authenticated;
create policy audit_writer on public.archea_project_audit for select to authenticated using(exists(select 1 from public.archea_projects p where p.id=project_id) and exists(select 1 from public.archea_project_writers where user_id=(select auth.uid())));
create index archea_project_audit_recent on public.archea_project_audit(created_at desc);
create index archea_projects_owner on public.archea_projects(owner_id);
-- Private trigger: no callable public privilege escalation. Seed import by postgres is permitted without a visitor identity.
create function archea_private.project_before_save() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' then new.revision:=old.revision+1; new.owner_id:=old.owner_id; else new.revision:=1; end if;
 new.updated_at:=now(); new.action:=left(new.action,200);
 if exists(select 1 from jsonb_array_elements(new.payload->'tasks') t where (t->>'pid')::bigint is distinct from new.id)
 or exists(select 1 from jsonb_array_elements(new.payload->'resources') t where (t->>'pid')::bigint is distinct from new.id)
 or exists(select 1 from jsonb_array_elements(new.payload->'assignments') t where (t->>'pid')::bigint is distinct from new.id) then raise exception 'Invalid project references'; end if;
 return new;
end $$;
create trigger archea_project_before before insert or update on public.archea_projects for each row execute function archea_private.project_before_save();
create function archea_private.project_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then
   if current_setting('role',true) not in ('none','postgres') then raise exception 'Authentication required'; end if;
   return new;
 end if;
 if not exists(select 1 from public.archea_project_writers where user_id=auth.uid()) then raise exception 'Writer required'; end if;
 insert into public.archea_project_audit(project_id,action,actor) values(new.id,new.action,auth.uid());
 return new;
end $$;
revoke all on function archea_private.project_audit() from public,anon,authenticated;
revoke all on function archea_private.project_before_save() from public,anon,authenticated;
create trigger archea_project_audit after insert or update on public.archea_projects for each row execute function archea_private.project_audit();
insert into public.archea_project_writers(user_id) select id from auth.users where email='giuseppe.milano@archea.it';
