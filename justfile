default:
    @just --list

# Format source files
format:
    pnpm exec prettier --write .

# Lint source files
lint:
    pnpm exec prettier --check .

# Type-check (no-op for now, pure JS)
check:
    node --check hooks/usage-estimate.mjs

# Run tests
test:
    echo '{"prompt": "hello world"}' | node hooks/usage-estimate.mjs | node -e "const r=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log('PASS:', r.systemMessage)"

# Dry-run publish
build:
    pnpm pack --dry-run

# Sync version from package.json to all other files
sync-version:
    #!/usr/bin/env bash
    VERSION=$(node -p "require('./package.json').version")
    node -e "const f='.claude-plugin/plugin.json'; const p=JSON.parse(require('fs').readFileSync(f,'utf8')); p.version=process.argv[1]; require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')" "$VERSION"
    echo "Synced version $VERSION"

# Publish to npm
publish: sync-version
    pnpm publish --access public
