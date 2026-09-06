import { z } from "zod";

export const RiskLevelSchema = z.enum(["R0", "R1", "R2", "R3"]);
export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "waiting_approval",
  "completed",
  "failed",
  "cancelled",
]);

export const TaskInputSchema = z.object({
  projectId: z.string().uuid(),
  workflowId: z.string().uuid(),
  prompt: z.string().trim().min(12).max(12_000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const AgentStepSchema = z.object({
  id: z.string().uuid(),
  agentSlug: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["pending", "running", "waiting_approval", "completed", "failed"]),
  risk: RiskLevelSchema,
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).optional(),
});

export const ApprovalDecisionSchema = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(2_000).optional(),
  idempotencyKey: z.string().uuid(),
});

export const RunEnvelopeSchema = z.object({
  runId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: RunStatusSchema,
  steps: z.array(AgentStepSchema).min(1),
  maxCostUsd: z.number().positive().max(100),
  timeoutSeconds: z.number().int().positive().max(3_600),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;
export type AgentStep = z.infer<typeof AgentStepSchema>;
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
export type RunEnvelope = z.infer<typeof RunEnvelopeSchema>;
