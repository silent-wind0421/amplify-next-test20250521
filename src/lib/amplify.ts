//src/lib/amplify.ts
import { Amplify } from "aws-amplify";
import config from "../../amplify_outputs.json";

let isConfigured = false;

export function configureAmplifyOnce() {
  if (!isConfigured) {
    Amplify.configure(config);
    isConfigured = true;
  }
}

export function isAmplifyConfigured() {
  return isConfigured;
}
