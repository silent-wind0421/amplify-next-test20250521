// src/app/amplify-client.ts
"use client";
import { Amplify } from "aws-amplify";
import outputs from "../..//amplify_outputs.json";

// idempotentにしたいなら簡易ガード
if (!Amplify.getConfig()?.Auth) {
  Amplify.configure(outputs);
}
