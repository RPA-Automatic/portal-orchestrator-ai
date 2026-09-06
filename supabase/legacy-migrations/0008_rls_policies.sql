create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members member
    where member.workspace_id = target_workspace_id
      and member.user_id = auth.uid()
  );
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.instruction_sets enable row level security;
alter table public.agents enable row level security;
alter table public.workflows enable row level security;
alter table public.tasks enable row level security;
alter table public.runs enable row level security;
alter table public.run_steps enable row level security;
alter table public.approvals enable row level security;
alter table public.artifacts enable row level security;
alter table public.audit_events enable row level security;

create policy workspaces_member_select on public.workspaces
for select to authenticated
using (public.is_workspace_member(id));

create policy workspace_members_member_select on public.workspace_members
for select to authenticated
using (public.is_workspace_member(workspace_id));

create policy workspace_owner_update on public.workspaces
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy projects_member_all on public.projects
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy skills_member_all on public.skills
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy instruction_sets_member_all on public.instruction_sets
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy agents_member_all on public.agents
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy workflows_member_all on public.workflows
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy tasks_member_all on public.tasks
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy runs_member_all on public.runs
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy run_steps_member_all on public.run_steps
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy approvals_member_all on public.approvals
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy artifacts_member_all on public.artifacts
for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy audit_member_select on public.audit_events
for select to authenticated
using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.audit_events from authenticated;

-- Rollback note: drop policies, disable RLS only in an isolated rollback window,
-- then drop the helper function after dependants are removed.
