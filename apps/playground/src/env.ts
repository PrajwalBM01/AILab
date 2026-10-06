import { z } from "zod";

export type ChatTarget = {
  baseUrl: string;
  apiKey?: string;
  model: string;
};

export function cloudTarget(): ChatTarget {
  const env = z
    .object({
      CLOUD_BASE_URL: z.string().min(1),
      CLOUD_API_KEY: z.string().min(1, "Add your key in the env file"),
      CLOUD_MODEL: z.string().min(1, "Copy a model ID from your provider"),
    })
    .parse(process.env);
  return {
    baseUrl: env.CLOUD_BASE_URL,
    apiKey: env.CLOUD_API_KEY,
    model: env.CLOUD_MODEL,
  };
}

export function localTarget(): ChatTarget {
  const env = z
    .object({
      LOCAL_BASE_URL: z.string().default("http://localhost:11434/v1"),
      LOCAL_MODEL: z.string().default("llama3.2"),
    })
    .parse(process.env);

  return {
    baseUrl: env.LOCAL_BASE_URL,
    model: env.LOCAL_MODEL,
  };
}
