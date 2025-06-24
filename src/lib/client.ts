//sec/lib/client.ts
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import amplifyConfig from "../../amplify_outputs.json"; // ← パスは必要に応じて調整

/**
 * Amplify Data Client のインスタンス。
 *
 * GraphQL モデル操作のために、`generateClient<Schema>()` を使用して
 * 型付きクライアントを生成する。アプリ全体で利用可能。
 *
 * @see https://docs.amplify.aws/javascript/build-a-backend/data/codegen/
 */
export const client = generateClient<Schema>({
  config: amplifyConfig,
  authMode: "userPool", // ✅ Cognito 認証を使う指定
});
