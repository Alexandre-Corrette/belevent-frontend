import { z } from 'zod'
import { emailField } from './auth'

// --- Helpers ---

/** Montant positif avec max 2 décimales */
const amountField = z
  .number({ error: 'Le montant doit être un nombre' })
  .min(0.01, 'Le montant doit être supérieur à 0')
  .max(999999.99, 'Le montant ne peut pas dépasser 999 999,99 €')
  .refine(
    (v) => Number((v * 100).toFixed(0)) === Math.round(v * 100),
    'Le montant doit avoir au maximum 2 décimales',
  )

/** Alphabet safe pour les codes d'invitation (pas de 0/O, 1/I/L) */
const SAFE_CODE_REGEX = /^[A-HJ-NP-Z2-9]{4}$/

// --- Événement ---

export const createEventSchema = z.object({
  title: z
    .string()
    .min(2, 'Le titre doit contenir au moins 2 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  category: z.enum(['mariage', 'seminaire', 'reception', 'anniversaire', 'communion', 'autre'], {
    error: 'Veuillez sélectionner une catégorie',
  }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit être au format AAAA-MM-JJ'),
  guestCount: z
    .number({ error: 'Le nombre d\'invités doit être un nombre' })
    .int('Le nombre d\'invités doit être un entier')
    .min(1, 'Il faut au moins 1 invité')
    .max(10000, 'Le nombre d\'invités ne peut pas dépasser 10 000'),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),
  budget: z
    .number()
    .min(0, 'Le budget ne peut pas être négatif')
    .max(9999999.99, 'Le budget ne peut pas dépasser 9 999 999,99 €')
    .optional(),
})

// --- Invitation client ---

export const inviteClientSchema = z.object({
  email: emailField,
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  eventId: z.number().optional(),
})

// --- Document (devis/facture) ---

export const createDocumentSchema = z.object({
  type: z.enum(['devis', 'facture'], {
    error: 'Veuillez sélectionner un type de document',
  }),
  designation: z
    .string()
    .min(2, 'La désignation doit contenir au moins 2 caractères')
    .max(2000, 'La désignation ne peut pas dépasser 2000 caractères'),
  category: z
    .string()
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .optional(),
  amount: amountField,
  clientId: z.number({ error: 'Veuillez sélectionner un client' }),
  eventId: z.number().optional(),
  reference: z
    .string()
    .max(100, 'La référence ne peut pas dépasser 100 caractères')
    .optional(),
})

// --- Lookup event par code ---

export const lookupCodeSchema = z.object({
  code: z
    .string()
    .regex(SAFE_CODE_REGEX, 'Code invalide (4 caractères alphanumériques)'),
})

// --- Join event ---

export const joinEventSchema = z.object({
  inviteCode: z
    .string()
    .regex(SAFE_CODE_REGEX, 'Code d\'invitation invalide'),
  category: z
    .string()
    .min(2, 'La catégorie doit contenir au moins 2 caractères')
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères'),
  notes: z
    .string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional(),
})

// --- Types inférés ---

export type CreateEventFormData = z.infer<typeof createEventSchema>
export type InviteClientFormData = z.infer<typeof inviteClientSchema>
export type CreateDocumentFormData = z.infer<typeof createDocumentSchema>
export type LookupCodeFormData = z.infer<typeof lookupCodeSchema>
export type JoinEventFormData = z.infer<typeof joinEventSchema>
