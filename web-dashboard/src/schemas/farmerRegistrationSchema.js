import { z } from 'zod';
import { ALL_COUNTRIES } from '../data/africanCountries.js';
import { formatPhoneE164 } from '../utils/phoneDial.js';

export const cropOptions = ['Mil', 'Sorgho', 'Maïs', 'Arachide', 'Coton', 'Niébé', 'Riz', 'Autre'];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const farmerRegistrationSchema = z
  .object({
    full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z
      .string()
      .optional()
      .transform((v) => (v ? v.trim().toLowerCase() : '')),
    phone: z.string().optional().transform((v) => (v ? v.trim() : '')),
    region: z.string().min(1, 'Choisissez une région ou commune'),
    country: z
      .string()
      .min(1, 'Choisissez un pays')
      .refine((c) => ALL_COUNTRIES.includes(c), { message: 'Choisissez un pays valide' }),
    crops: z.array(z.string()).min(1, 'Sélectionnez au moins une culture principale'),
    area_hectares: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z.number().positive('Indiquez une superficie valide'),
    ),
    area_unit: z.enum(['hectares', 'acres']),
    has_irrigation: z.enum(['oui', 'non', 'partiel'], {
      errorMap: () => ({ message: 'Indiquez votre situation d’irrigation' }),
    }),
    cooperative_member: z.boolean(),
    cooperative_name: z.string().optional(),
    consent: z.boolean().refine((v) => v === true, {
      message: 'Vous devez accepter l’utilisation des données',
    }),
  })
  .superRefine((data, ctx) => {
    const email = data.email?.trim() || '';
    const phone = data.phone?.trim() || '';

    if (!email && !phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indiquez un email ou un numéro de téléphone',
        path: ['phone'],
      });
      return;
    }

    if (email && !emailRegex.test(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adresse email invalide',
        path: ['email'],
      });
    }

    if (phone) {
      const e164 = formatPhoneE164(phone, data.country);
      if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numéro invalide pour le pays sélectionné',
          path: ['phone'],
        });
      }
    }

    if (data.cooperative_member && (!data.cooperative_name || data.cooperative_name.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indiquez le nom de la coopérative',
        path: ['cooperative_name'],
      });
    }
  });

export const step1Fields = ['full_name', 'email', 'phone', 'region', 'country'];
export const step2Fields = [
  'crops',
  'area_hectares',
  'area_unit',
  'has_irrigation',
  'cooperative_member',
  'cooperative_name',
];
