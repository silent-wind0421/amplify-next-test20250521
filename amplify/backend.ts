// amplify/backend.ts

import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";

export const backend = defineBackend({
  auth,
  data,
});
