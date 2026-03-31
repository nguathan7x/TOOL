import { z } from 'zod';

const strongPasswordSchema = z
  .string()
  .min(8)
  .max(64)
  .refine((value) => /[A-Z]/.test(value), 'Password must include at least one uppercase letter')
  .refine((value) => /[a-z]/.test(value), 'Password must include at least one lowercase letter')
  .refine((value) => /\d/.test(value), 'Password must include at least one number')
  .refine((value) => /[^A-Za-z0-9]/.test(value), 'Password must include at least one special character');

const avatarDataUrlSchema = z
  .string()
  .max(12_000_000)
  .refine((value) => /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value), 'Avatar must be a supported image file');

const profileGenderSchema = z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']);
const optionalTrimmedString = (max) => z.union([z.string().trim().max(max), z.literal(''), z.null()]).transform((value) => value || null);
const optionalDateString = z.union([z.string().date(), z.literal(''), z.null()]).transform((value) => value || null);

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    password: strongPasswordSchema,
    userType: z.enum(['INTERNAL', 'CLIENT', 'EXTERNAL_SUPPORT']).optional(),
    specialization: z.enum(['DEV', 'QA', 'TESTER', 'DESIGNER', 'BA']).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(64)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const googleLoginSchema = z.object({
  body: z.object({
    code: z.string().min(1)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const logoutSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    specialization: z.enum(['DEV', 'QA', 'TESTER', 'DESIGNER', 'BA']),
    avatarUrl: avatarDataUrlSchema.nullable().optional(),
    phone: optionalTrimmedString(32),
    birthday: optionalDateString,
    gender: z.union([profileGenderSchema, z.literal(''), z.null()]).transform((value) => value || null),
    address: optionalTrimmedString(180),
    bio: optionalTrimmedString(600)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8).max(64),
    newPassword: strongPasswordSchema
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
