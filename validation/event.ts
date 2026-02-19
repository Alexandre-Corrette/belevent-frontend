import { z } from 'zod'

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}

const safeString = z.string().transform((v) => stripHtml(v.trim()))

export const inviteClientSchema = z.object({
  email: safeString.pipe(z.string().email('Adresse email invalide')),
  firstName: safeString.pipe(
    z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  ),
  lastName: safeString.pipe(
    z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  ),
})

export type InviteClientFormData = z.infer<typeof inviteClientSchema>
