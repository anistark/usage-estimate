import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { createHash } from "crypto";
import { tmpdir, homedir } from "os";
import { join } from "path";
import { encodingForModel } from "js-tiktoken";

const STATE_FILE = join(tmpdir(), "usage-estimate-state.json");
const STATE_TTL_MS = 30_000; // 30 seconds
const DEFAULT_THRESHOLD = 10_000;

// Read stdin (hook receives JSON)
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// Read threshold from ~/.claude/settings.json
function getThreshold() {
  try {
    const settingsPath = join(homedir(), ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    const val = settings?.["usage-estimate"]?.blockThreshold;
    if (val === 0 || val === null) return null; // null = never block
    return typeof val === "number" ? val : DEFAULT_THRESHOLD;
  } catch {
    return DEFAULT_THRESHOLD;
  }
}

// Hash prompt for state matching
function hashPrompt(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// Check if state file has a matching, non-expired entry
function checkState(promptHash) {
  try {
    if (!existsSync(STATE_FILE)) return false;
    const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    if (state.hash === promptHash && Date.now() - state.ts < STATE_TTL_MS) {
      unlinkSync(STATE_FILE);
      return true; // second press — allow through
    }
    return false;
  } catch {
    return false;
  }
}

// Write state for "first press" blocking
function writeState(promptHash) {
  writeFileSync(
    STATE_FILE,
    JSON.stringify({ hash: promptHash, ts: Date.now() }),
    "utf8",
  );
}

async function main() {
  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // can't parse, let it through
  }

  const prompt = input.prompt || "";
  if (!prompt.trim()) {
    process.exit(0);
  }

  // Count tokens
  const enc = encodingForModel("gpt-4o");
  const tokens = enc.encode(prompt).length;

  const threshold = getThreshold();

  const count = tokens.toLocaleString();

  // Below threshold or blocking disabled → show count and allow
  if (threshold === null || tokens <= threshold) {
    process.stdout.write(JSON.stringify({ systemMessage: `You'd be using ~${count} tokens...` }));
    process.exit(0);
  }

  // Above threshold — check if this is the second press
  const promptHash = hashPrompt(prompt);
  if (checkState(promptHash)) {
    // Second press — allow through
    process.stdout.write(JSON.stringify({ systemMessage: `You'd be using ~${count} tokens (confirmed).` }));
    process.exit(0);
  }

  // First press — block and warn
  writeState(promptHash);
  const warning = `You'd be using ~${count} tokens, which exceeds the ${threshold.toLocaleString()} threshold. Press Enter again to send anyway.`;
  process.stderr.write(warning);
  process.exit(2);
}

main();
