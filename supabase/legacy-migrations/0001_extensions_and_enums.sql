-- Phase 0: shared extensions and state types.
create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.task_status as enum ('draft', 'planned', 'approved', 'running', 'completed', 'failed', 'cancelled');
create type public.run_status as enum ('queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled');
create type public.step_status as enum ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'skipped');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'expired');
create type public.risk_level as enum ('R0', 'R1', 'R2', 'R3');

-- Rollback note: enum removal requires first dropping every dependent table.
