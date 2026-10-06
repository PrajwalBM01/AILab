import type { ChatTarget } from "./env";
import { z } from "zod";

const ChatResponse = z.object({
  choices: z.array(
    z.object({ message: z.object({ content: z.string().nullable() }) }),
  ),
  usage: z
    .object({ prompt_tokens: z.number(), completion_tokens: z.number() })
    .optional(),
});

export async function chat(target: ChatTarget, question: string) {
  const started = Date.now();

  const res = await fetch(`${target.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(target.apiKey ? { Authorization: `Bearer ${target.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: target.model,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly tutor. Answer in at most three sentences.",
        },
        { role: "user", content: question },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const data = ChatResponse.parse(await res.json());

  return {
    text: data.choices[0]?.message.content ?? "",
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    ms: Date.now() - started,
  };
}

export async function* chatStream(target: ChatTarget, question: string) {
  const res = await fetch(`${target.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(target.apiKey ? { Authorization: `Bearer ${target.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: target.model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a friendly tutor. Answer in at most three sentences.",
        },
        { role: "user", content: question },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
      if (delta) yield delta as string;
    }
  }
}
