import { chat } from "./chat";
import { cloudTarget, localTarget } from "./env";

const which = process.argv[2] ?? "local";
const question =
  process.argv[3] ?? "What is an API? Explain it to a 10-year-old.";
const target = which === "cloud" ? cloudTarget() : localTarget();
const result = await chat(target, question);
console.log(result.text);
console.log(
  `\n— ${target.model} | ${result.ms} ms | ` +
    `${result.inputTokens ?? "?"} tokens in, ${result.outputTokens ?? "?"} tokens out`,
);
