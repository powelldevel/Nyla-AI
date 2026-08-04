import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "@/lib/env/public";
import { parseServerEnvironment } from "@/lib/env/server-schema";

describe("environment validation", () => {
  it("allows an empty foundation environment", () => {
    expect(parseServerEnvironment({})).toEqual({});
  });

  it("parses the prepared public and server variables", () => {
    const environment = parseServerEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-placeholder",
      SUPABASE_SERVICE_ROLE_KEY: "service-placeholder",
      OPENAI_API_KEY: "openai-placeholder",
      OPENAI_MODEL: "model-placeholder",
      OPENAI_EMBEDDING_MODEL: "embedding-placeholder",
    });

    expect(environment.OPENAI_MODEL).toBe("model-placeholder");
    expect(environment.NEXT_PUBLIC_SUPABASE_URL).toBe("https://project.supabase.co");
  });

  it("rejects a malformed public Supabase URL", () => {
    expect(() => parsePublicEnvironment({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow();
  });

  it("never returns server values from the public parser", () => {
    const publicEnvironment = parsePublicEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "must-not-cross-the-boundary",
    });

    expect(publicEnvironment).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  });
});
