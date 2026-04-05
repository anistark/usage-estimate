#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, rmSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const PLUGIN_DIR = join(homedir(), ".claude", "plugins", "usage-estimate");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function log(msg) {
  console.log(`${CYAN}usage-estimate${RESET} ${msg}`);
}

function install() {
  if (existsSync(PLUGIN_DIR)) {
    log(`Plugin already exists at ${DIM}${PLUGIN_DIR}${RESET}`);
    log(`Run ${CYAN}npx usage-estimate uninstall${RESET} first to reinstall.`);
    process.exit(1);
  }

  log("Installing plugin...");

  // Create plugin directory
  mkdirSync(PLUGIN_DIR, { recursive: true });

  // Copy plugin files
  const filesToCopy = [".claude-plugin", "hooks", "skills", "package.json"];
  for (const f of filesToCopy) {
    const src = join(PKG_ROOT, f);
    const dest = join(PLUGIN_DIR, f);
    cpSync(src, dest, { recursive: true });
  }

  // Install dependencies in plugin dir
  log("Installing dependencies...");
  const pm = detectPackageManager();
  try {
    execSync(`${pm} install --omit=dev`, {
      cwd: PLUGIN_DIR,
      stdio: "pipe",
    });
  } catch {
    // Fallback to npm if preferred pm fails
    if (pm !== "npm") {
      execSync("npm install --omit=dev", {
        cwd: PLUGIN_DIR,
        stdio: "pipe",
      });
    }
  }

  log(`${GREEN}Installed${RESET} to ${DIM}${PLUGIN_DIR}${RESET}`);
  console.log();
  log("Next steps:");
  log(`  1. Enable the plugin in Claude Code ${DIM}(/plugins)${RESET}`);
  log(`  2. Restart Claude Code`);
  console.log();
  log(`Optional: add to ${DIM}~/.claude/settings.json${RESET}:`);
  console.log(
    `  ${DIM}{ "usage-estimate": { "blockThreshold": 10000 } }${RESET}`,
  );
}

function uninstall() {
  if (!existsSync(PLUGIN_DIR)) {
    log("Plugin is not installed.");
    process.exit(0);
  }

  rmSync(PLUGIN_DIR, { recursive: true, force: true });
  log(`${GREEN}Uninstalled${RESET} from ${DIM}${PLUGIN_DIR}${RESET}`);
}

function detectPackageManager() {
  for (const pm of ["pnpm", "npm"]) {
    try {
      execSync(`${pm} --version`, { stdio: "pipe" });
      return pm;
    } catch {
      continue;
    }
  }
  return "npm";
}

const command = process.argv[2];

switch (command) {
  case "install":
    install();
    break;
  case "uninstall":
    uninstall();
    break;
  default:
    console.log(`
${CYAN}usage-estimate${RESET} - Token estimation plugin for Claude Code

Commands:
  ${GREEN}npx usage-estimate install${RESET}     Install the plugin
  ${GREEN}npx usage-estimate uninstall${RESET}   Remove the plugin
`);
}
