import { z, type ZodError } from 'zod'

// Helper: extracts first error per field from a ZodError (v3 + v4 compatible)
export function flattenErrors(zodError: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of zodError.issues) {
    const key = String(issue.path[0] ?? '_form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

// ─── Téléphone marocain ────────────────────────────────────────────────────
const moroccanPhone = z
  .string()
  .regex(
    /^(\+212|0)(5|6|7)\d{8}$/,
    'Format invalide — ex: 0612345678 ou +212612345678'
  )

// ─── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Minimum 2 caractères'),
    email:    z.string().email('Email invalide'),
    password: z.string().min(6, 'Minimum 6 caractères'),
    confirm:  z.string().min(1, 'Requis'),
    role:     z.enum(['client', 'vendor']),
  })
  .refine(d => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

// ─── Contact ───────────────────────────────────────────────────────────────
export const contactSchema = z.object({
  name:    z.string().min(2, 'Minimum 2 caractères'),
  email:   z.string().email('Email invalide'),
  reason:  z.string().min(1, 'Veuillez sélectionner un sujet'),
  message: z.string().min(10, 'Minimum 10 caractères'),
})

// ─── Checkout ──────────────────────────────────────────────────────────────
export const checkoutSchema = z
  .object({
    name:              z.string().min(1, 'Champ requis').trim(),
    phone:             moroccanPhone,
    address:           z.string().optional().default(''),
    addressComplement: z.string().optional().default(''),
    notes:             z.string().optional().default(''),
    deliveryMode:      z.enum(['delivery', 'pickup']),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMode === 'delivery') {
      if (!data.address?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Adresse requise pour la livraison',
          path: ['address'],
        })
      }
      if (!data.addressComplement?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: "Complément d'adresse requis",
          path: ['addressComplement'],
        })
      }
    }
  })

// ─── Vendor onboarding (par étape) ────────────────────────────────────────
export const vendorStep0Schema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  type: z.enum(['restaurant', 'homecook', 'popup']),
})

export const vendorStep1Schema = z.object({
  city: z.string().min(1, 'Veuillez sélectionner une ville'),
})

export const vendorStep2Schema = z.object({
  cuisine: z.string().min(1, 'Veuillez sélectionner un type de cuisine'),
})

const vendorPhoneDigits = z
  .string()
  .refine(
    v => v === '' || /^\d{9}$/.test(v),
    '9 chiffres requis après +212'
  )

export const vendorStep3Schema = z.object({
  phone:     vendorPhoneDigits,
  whatsapp:  vendorPhoneDigits,
  instagram: z.string().optional(),
})

// ─── Messages ──────────────────────────────────────────────────────────────
export const messageSchema = z.object({
  text: z.string().min(1, 'Le message ne peut pas être vide').trim(),
})
