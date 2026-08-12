import { z } from "zod";

import { optionalEnvironmentString, optionalEnvironmentUrl } from "./normalizers";

export const serverEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalEnvironmentUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalEnvironmentString,
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvironmentString,
  OPENAI_API_KEY: optionalEnvironmentString,
  OPENAI_MODEL: optionalEnvironmentString,
  OPENAI_EMBEDDING_MODEL: optionalEnvironmentString,
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  source: Readonly<Record<string, string | undefined>>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: source.OPENAI_API_KEY,
    OPENAI_MODEL: source.OPENAI_MODEL,
    OPENAI_EMBEDDING_MODEL: source.OPENAI_EMBEDDING_MODEL,
  });
}
