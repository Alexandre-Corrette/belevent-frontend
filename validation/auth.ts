import { z } from 'zod'

// --- Helpers réutilisables ---

/** Strip les balises HTML d'un string (protection XSS) */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

const safeString = z
  .string()
  .transform((v) => stripHtml(v.trim()))

const emailField = safeString
  .pipe(z.string().email('Adresse email invalide'))

const passwordComplexity = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[^A-Za-z0-9]/,
    'Le mot de passe doit contenir au moins un caractère spécial',
  )

function withConfirmPassword<T extends z.ZodTypeAny>(
  schema: T,
) {
  return z
    .object({
      password: passwordComplexity,
      confirmPassword: z.string(),
    })
    .merge(schema instanceof z.ZodObject ? schema : z.object({}))
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword'],
    })
}

// --- Schémas ---

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export const registerStep1Schema = z
  .object({
    email: emailField,
    password: passwordComplexity,
    confirmPassword: z.string(),
    firstName: safeString.pipe(
      z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    ),
    lastName: safeString.pipe(
      z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const firstLoginSchema = z
  .object({
    password: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailField,
})

export const resetPasswordSchema = z
  .object({
    password: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  firstName: safeString.pipe(
    z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  ),
  lastName: safeString.pipe(
    z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  ),
  phone: z.string().optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

// --- Types inférés ---

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterStep1FormData = z.infer<typeof registerStep1Schema>
export type FirstLoginFormData = z.infer<typeof firstLoginSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// --- Export helpers pour réutilisation ---

export { passwordComplexity, emailField, stripHtml }