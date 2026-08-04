import { z } from "zod";

import { optionalEnvironmentString, optionalEnvironmentUrl } from "./normalizers";

export const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalEnvironmentUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalEnvironmentString,
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function parsePublicEnvironment(
  source: Readonly<Record<string, string | undefined>>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export const publicEnvironment = parsePublicEnvironment({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
