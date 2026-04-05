---
name: usage-estimate
description: Configure the usage-estimate plugin threshold
argument-hint: "<maxToken NUMBER | status>"
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
---

# usage-estimate configuration

The user wants to configure the usage-estimate plugin.

## Commands

Parse the user's argument:

- `maxToken <number>` — Set the blocking threshold to `<number>` tokens. Read `~/.claude/settings.json`, update (or create) the `"usage-estimate"` key with `{ "blockThreshold": <number> }`, and write it back. Preserve all other settings. Tell the user the new threshold and that they need to restart Claude Code.
- `maxToken 0` or `maxToken off` — Disable blocking. Set `"blockThreshold"` to `0`.
- `status` — Read `~/.claude/settings.json` and show the current `usage-estimate.blockThreshold` value. If not set, report the default (10,000).
- No argument or `help` — Show available commands.
