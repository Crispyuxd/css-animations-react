# Motion+ AI Kit — setup

How to install and use Motion's AI tooling for this project. Each developer
needs their own Motion+ account ($89 AI Kit tier or $399 full Motion+) and
their own personal access token.

> ⚠️ Motion+ is a single-user license. Do not share tokens across people.

---

## What you get

### Four skills (slash commands in Claude Code, Cursor, etc.)

| Skill | What it does |
|---|---|
| `/motion` | Senior-engineer-level guidance on the Motion API across vanilla JS, React, and Vue. Knows imports, performance patterns, when to use springs, when to use `will-change`. |
| `/motion-audit` | Scans every animation + transition in the repo. Ranks each S-tier (compositor-only) → F-tier (layout thrashing). Generates a report with specific fixes. |
| `/css-spring` | Type "soft, slightly bouncy" or pass bounce/duration numbers. Returns a CSS `linear()` easing string. |
| `/see-transition` | Renders a visual preview of any easing curve or spring config so you can eyeball it before running the dev server. |

### One MCP

**Motion Studio MCP** — gives the AI live access to:

- Up-to-date Motion docs (no stale training-data answers)
- 330+ vetted code examples from the official Motion repo (full Motion+ only)
- Saved transitions in your Motion+ profile
- Tools: `generate-css-spring`, `see-transition`, doc/example search

### (Optional) Motion Studio extension

Visual transition editor for VS Code or Cursor. Scrub spring/curve, preview live, write CSS/JS back. Install separately from the editor's marketplace — not handled by this guide. Not relevant if you're CLI-only with Claude Code.

---

## Install (one-time per developer, per machine)

### 1. Get a personal access token

Sign in at https://plus.motion.dev/personal-token and copy the token.

### 2. Install the four skills

```bash
curl -sL "https://api.motion.dev/registry/skills/motion-ai-kit?token=YOUR_TOKEN" -o /tmp/ai-kit.sh && bash /tmp/ai-kit.sh < /dev/null
```

The `< /dev/null` flag puts the installer in non-interactive mode (installs all four skills). Auto-detects which AI editors you have: Claude Code (`~/.claude/`), Cursor, Amp, OpenCode, Gemini CLI, Windsurf.

### 3. Add the Motion Studio MCP to Claude Code

```bash
claude mcp add motion --scope local \
  -e TOKEN=YOUR_TOKEN \
  -- npx -y "https://api.motion.dev/registry.tgz?package=motion-studio-mcp&version=latest"
```

`--scope local` stores the config in your local `~/.claude.json` (per-machine, not committed). The token is set via env var, not in any repo file.

> Restart Claude Code after this step so the MCP's tool schemas load into your session.

### 4. Verify

```bash
claude mcp list
# expect: motion: npx -y https://api.motion.dev/... - ✓ Connected
```

In Claude Code, the four slash commands (`/motion`, `/motion-audit`, `/css-spring`, `/see-transition`) should appear in your skill list, and Motion MCP tools (`mcp__motion__*`) should be available.

---

## How to use this on css-animations-react

### One-shot: audit existing animations

Run `/motion-audit` and let it scan the whole repo. Get a tier-ranked report of every keyframe and transition — anything below B-tier is worth fixing.

### When designing new animations

- **"How should I animate X?"** → ask `/motion` for the right approach for our pure-CSS keyframe context.
- **"What spring feels like Y?"** → `/css-spring` with your description, paste the `linear()` output into the keyframe.
- **"Does this curve look right?"** → `/see-transition` to preview without dev-server reload.
- **"Show me a Motion example for Z"** → ask the chat directly; the MCP pulls from 330+ premium examples and adapts.

### When doing a smoothness pass on a demo

Workflow:

1. `/motion-audit` on the demo's files first
2. Borrow patterns from MCP examples for any structurally tricky reveals
3. Use `/css-spring` for any non-trivial easing
4. Use `/see-transition` to validate before committing

This replaces the manual benchmarking we did against linear.app + elevenlabs.io for the forms pilot.

---

## Caveats for this project

Motion's library is JS-runtime (Framer Motion's successor). Our timeline engine emits **pure CSS keyframes** with no JS animation runtime. So:

- `/motion` will sometimes recommend `motion.div` / `useAnimate` patterns. Translate the underlying principle (curves, performance hints) rather than literal API calls.
- `/motion-audit`, `/css-spring`, and `/see-transition` are framework-agnostic — they work fine on raw CSS and the timeline engine output.
- The MCP's example library is mostly Motion-React patterns. Useful for inspiration on timing/values; rarely a copy-paste target.

---

## Security

- Personal token is in `~/.claude.json` only. Never committed.
- This file (`MOTION-PLUS.md`) uses `YOUR_TOKEN` placeholders.
- Do not share the token with teammates — they need their own.
