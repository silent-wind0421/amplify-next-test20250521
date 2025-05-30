// amplify/configureAmplify.ts
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

export const configureAmplify = () => {
    Amplify.configure(outputs); // ← .env ではなく outputs を直接使う
};
