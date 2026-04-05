# usage-estimate

Token estimation plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Shows how many tokens your prompt will consume before it's sent.

## Install

```sh
npx usage-estimate install
```

Then enable the plugin in Claude Code (`/plugins`) and restart the session.

## What it does

Every prompt you submit shows an estimated token count like `~142 tokens`.

If a prompt exceeds the blocking threshold (default: 10,000 tokens), it pauses and asks you to press Enter again to confirm.

## Configuration

Set the threshold with a slash command:

```
/usage-estimate maxToken 5000
/usage-estimate maxToken off
/usage-estimate status
```

Or add to `~/.claude/settings.json` manually:

```json
{
  "usage-estimate": {
    "blockThreshold": 10000
  }
}
```

| Value | Behavior |
|-------|----------|
| `10000` (default) | Block prompts over 10k tokens |
| Any number | Block prompts over that many tokens |
| `0` or `null` | Never block, just show the estimate |

## Uninstall

```sh
npx usage-estimate uninstall
```

## How it works

Uses a `UserPromptSubmit` hook that intercepts prompts after you press Enter but before they're sent to Claude. Tokens are counted locally using [js-tiktoken](https://github.com/openai/tiktoken) with the `cl100k_base` encoding — no API calls, no latency. The count is an approximation (~10-15% margin).

## License

[MIT](LICENSE)
