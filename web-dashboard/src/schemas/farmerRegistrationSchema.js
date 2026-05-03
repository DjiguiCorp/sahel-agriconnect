import { z } from 'zod';
import { AFRICAN_COUNTRIES } from '../data/africanCountries.js';

export const cropOptions = ['Mil', 'Sorgho', 'Maïs', 'Arachide', 'Coton', 'Niébé', 'Riz', 'Autre'];

/** E.164 international (Afrique et au-delà) */
const phoneRegex = /^\+[1-9]\d{7,14}$/;

export const farmerRegistrationSchema = z
  .object({
    full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    phone: z
      .string()
      .min(8, 'Téléphone requis')
      .regex(phoneRegex, 'Format international : + et indicatif pays, puis numéro (ex. +22376123456)'),
    region: z.string().min(1, 'Choisissez une région ou commune'),
    country: z
      .string()
      .min(1, 'Choisissez un pays')
      .refine((c) => AFRICAN_COUNTRIES.includes(c), { message: 'Choisissez un pays valide' }),
    crops: z.array(z.string()).min(1, 'Sélectionnez au moins une culture principale'),
    area_hectares: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z.number().positive('Indiquez une superficie valide')
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
    if (data.cooperative_member && (!data.cooperative_name || data.cooperative_name.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indiquez le nom de la coopérative',
        path: ['cooperative_name'],
      });
    }
  });

export const step1Fields = ['full_name', 'phone', 'region', 'country'];
export const step2Fields = [
  'crops',
  'area_hectares',
  'area_unit',
  'has_irrigation',
  'cooperative_member',
  'cooperative_name',
]; // validation combinée étape 2 : déclenchée avec étape 1 pour appliquer le superRefine
