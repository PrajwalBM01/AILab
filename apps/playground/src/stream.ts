import { chatStream } from "./chat";
import { cloudTarget, localTarget } from "./env";

const which = process.argv[2] ?? "local";
const question =
  process.argv[3] ?? "What is an API? Explain it to a 10-year-old.";
const target = which === "cloud" ? cloudTarget() : localTarget();
for await (const piece of chatStream(target, question)) {
  process.stdout.write(piece);
}
