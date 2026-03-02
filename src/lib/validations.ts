import { z } from "zod";

// ==================== AUTH ====================

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  companyName: z.string().min(1, "Company name is required").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ==================== PIPELINES ====================

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Pipeline name is required").max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePipelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ==================== STAGES ====================

export const createStageSchema = z.object({
  name: z.string().min(1, "Stage name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  daysExpected: z.number().int().min(1).optional(),
});

export const updateStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  daysExpected: z.number().int().min(1).nullish(),
  checklist: z.string().nullish(),
  documentsRequired: z.string().nullish(),
  resourceLinks: z.string().nullish(),
});

// ==================== CLIENTS ====================

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  companyName: z.string().max(100).optional(),
  source: z.enum(["MANUAL", "WIDGET", "REFERRAL", "WEBSITE", "SOCIAL_MEDIA", "ADVERTISING", "OTHER"]).optional(),
  sourceDetail: z.string().max(200).optional(),
  projectType: z.string().max(100).optional(),
  projectValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
