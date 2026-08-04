import "server-only";

import { parseServerEnvironment } from "./server-schema";

export function getServerEnvironment() {
  return parseServerEnvironment(process.env);
}
