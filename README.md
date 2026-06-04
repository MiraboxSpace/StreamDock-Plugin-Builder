# StreamDock Plugin Builder Skill

**English** | [中文](README.zh-CN.md)

A cross-platform **Agent Skill** that lets AI agents (Claude Code / Codex /
OpenClaw / Hermes) turn a user's **plain-text request** into a complete,
installable **StreamDock** (Mirabox Stream Dock) plugin, starting from a bundled
template.

- Covers the whole flow: `manifest.json`, the Node.js backend, the Property
  Inspector, building and installing
- Bundles a complete working plugin template + 9 reference docs + common-scenario
  code snippets
- Standard `SKILL.md` format — **works with Claude Code, Codex, OpenClaw, and
  Hermes**

## Installation

### Claude Code (plugin marketplace)

Run these in Claude Code, in order:

```
/plugin marketplace add MiraboxSpace/StreamDock-Plugin-Builder
/plugin install streamdock-plugin-builder@streamdock-marketplace
```

The first line registers this repo as a plugin marketplace; the second installs
the plugin from it. It takes effect in a new session.

### Codex (skill-installer)

Run this in Codex:

```
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/streamdock-plugin-builder
```

Codex calls its official script to install the skill into `~/.codex/skills/`.
**Restart Codex** afterward for it to take effect.

### OpenClaw

Clone the repo, then install the skill from the local path:

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder
```

Add `--global` to install into `~/.openclaw/skills/` for all local agents.
Start a new session for OpenClaw to load it.

**Or just paste this prompt to OpenClaw and let it install itself:**

```
Install the StreamDock plugin-builder skill from https://github.com/MiraboxSpace/StreamDock-Plugin-Builder — clone the repo and run `openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder` (add --global for all agents), then start a new session so the skill loads.
```

### Hermes

Clone the repo, then copy the skill folder into the Hermes skills directory:

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
cp -R ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder \
  ~/.hermes/skills/streamdock-plugin-builder
```

Hermes auto-discovers it on the next startup.

**Or just paste this prompt to Hermes and let it install itself:**

```
Install the StreamDock plugin-builder skill from https://github.com/MiraboxSpace/StreamDock-Plugin-Builder — clone the repo and copy its skills/streamdock-plugin-builder folder to ~/.hermes/skills/streamdock-plugin-builder (so that ~/.hermes/skills/streamdock-plugin-builder/SKILL.md exists), then reload your skills.
```

### Manual install (any agent)

The skill is a single self-contained folder: `skills/streamdock-plugin-builder/`
(it holds `SKILL.md`, `references/`, and `assets/`). Copy that whole folder into
the matching directory for your agent:

- Claude Code: `~/.claude/skills/streamdock-plugin-builder/`
- Codex: `~/.codex/skills/streamdock-plugin-builder/`
- OpenClaw: `~/.openclaw/skills/streamdock-plugin-builder/`
- Hermes: `~/.hermes/skills/streamdock-plugin-builder/`

After copying, the directory should contain `SKILL.md` at its top level (e.g.
`~/.hermes/skills/streamdock-plugin-builder/SKILL.md`).

## Usage

After installing, just describe what you want in natural language. Here are
some example prompts:

> Make me a StreamDock plugin: pressing the key mutes / unmutes, and the key
> shows the current state.

> Make me a coin-flip plugin. In the Property Inspector the user can choose how
> many coins to flip (1–5). Pressing the key plays an ~800 ms SVG frame-by-frame
> toss animation — the coins arc upward, spin edge-on at the peak, then fall and
> land showing each result as H (Heads) or T (Tails) directly on the key. The
> last result stays on the key until the next flip.

The agent loads this skill automatically and follows the workflow: clarify the
requirements → generate from the template → implement the logic → build and
install to StreamDock.

### Development workflow (what to expect)

The agent works in two stages. Knowing this helps you get the best result:

**Stage 1 — dev mode (iterate until it works)**

The agent runs `npm run dev`, which installs a thin launcher into StreamDock's
plugins folder and reloads the plugin automatically — no bundling needed.

- **First time only:** the agent will ask you to restart the StreamDock app
  once so it picks up the new plugin folder.
- **After each change:** the agent runs `npm run dev` again; StreamDock
  reloads the plugin automatically — no more manual restarts.
- After each `npm run dev` the agent will ask you to **test the plugin in
  StreamDock and report back**. Fix → dev → test until you're satisfied.

**Stage 2 — build (when you're happy with it)**

Once everything works, **tell the agent** — for example:

> "Looks good, please build it."  
> "没问题，打包吧。"  
> "Works fine, ship it."

The agent then runs `npm run build`, which bundles the plugin into a single
file, installs it, and StreamDock reloads automatically.

> **Why is this step separate?** The dev launcher runs your source code
> directly and exits after each run so StreamDock can reload it. A production
> build bundles everything into one file so the plugin runs reliably without
> a development environment. You need to explicitly ask for the build — the
> agent will not run it automatically.

## Repository layout

```
streamdock-plugin-builder/
├── .claude-plugin/
│   ├── marketplace.json      # Claude Code plugin marketplace manifest
│   └── plugin.json           # Claude Code plugin manifest
├── .codex-plugin/
│   └── plugin.json           # Codex plugin manifest
└── skills/
    └── streamdock-plugin-builder/   # the skill — one self-contained folder
        ├── SKILL.md          # the skill's main file (agent entry point)
        ├── references/       # 9 reference docs
        └── assets/
            └── plugin-template/   # a complete, working plugin template
```

All four agents use the same `skills/streamdock-plugin-builder/` folder — Claude
Code and Codex discover it through their `.claude-plugin/` / `.codex-plugin/`
manifests, while OpenClaw and Hermes install that folder directly (see above).
The per-agent manifest files do not affect each other.

## License

MIT
