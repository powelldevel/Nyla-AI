import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export const optionalEnvironmentString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional(),
);

export const optionalEnvironmentUrl = z.preprocess(emptyStringToUndefined, z.url().optional());
