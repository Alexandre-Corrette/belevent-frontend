import { z } from 'zod'

/** Strip les balises HTML d'un string (protection XSS) */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

const safeString = z
  .string()
  .transform((v) => stripHtml(v.trim()))

// Regex téléphone FR : +33, 06, 07, 01-05, 09
const frenchPhoneRegex = /^(?:(?:\+33|0)\s?[1-9])(?:[\s.-]?\d{2}){4}$/

export const companyStep2Schema = z.object({
  siret: z
    .string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres'),
  companyName: safeString.pipe(
    z.string().min(1, 'Le nom de la société est requis'),
  ),
  address: safeString.pipe(
    z.string().min(1, "L'adresse est requise"),
  ),
})

export const contactSchema = z.object({
  email: safeString.pipe(z.string().email('Adresse email invalide')),
  firstName: safeString.pipe(
    z.string().min(1, 'Le prénom est requis'),
  ),
  lastName: safeString.pipe(
    z.string().min(1, 'Le nom est requis'),
  ),
  role: z.enum(['admin', 'commercial', 'comptabilite'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }),
  phone: z
    .string()
    .regex(frenchPhoneRegex, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
})

// --- Types inférés ---

export type CompanyStep2FormData = z.infer<typeof companyStep2Schema>
export type ContactFormData = z.infer<typeof contactSchema>