# StreamDock Plugin Builder Skill

[English](README.md) | **中文**

一个跨平台 **Agent Skill**：让 AI 智能体（Claude Code / Codex / OpenClaw /
Hermes）根据用户的 **文字需求**，从内置模板出发，开发一个完整、可安装的
**StreamDock**（Mirabox Stream Dock）插件。

- 覆盖 `manifest.json`、Node.js 后端、Property Inspector、构建安装全流程
- 内置完整可用的插件模板 + 9 份参考文档 + 常见场景代码片段
- 标准 `SKILL.md` 格式，**Claude Code、Codex、OpenClaw、Hermes 通用**

## 安装

### Claude Code（插件市场）

在 Claude Code 里依次执行：

```
/plugin marketplace add MiraboxSpace/StreamDock-Plugin-Builder
/plugin install streamdock-plugin-builder@streamdock-marketplace
```

第一行把本仓库登记为插件市场，第二行从该市场安装插件。新开会话即生效。

### Codex（skill-installer）

在 Codex 里执行：

```
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/streamdock-plugin-builder
```

Codex 会调用官方脚本把 skill 装进 `~/.codex/skills/`。装完**重启 Codex**生效。

### OpenClaw

先 clone 仓库，再从本地路径安装该 skill：

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder
```

加 `--global` 可装进 `~/.openclaw/skills/` 供所有本地 agent 使用。新开会话即加载。

**或者直接把下面这段提示词丢给 OpenClaw，让它自己装：**

```
帮我安装 StreamDock plugin-builder 技能，来源https://github.com/MiraboxSpace/StreamDock-Plugin-Builder ——clone 这个仓库，然后运行`openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder`（要全局可用就加 --global），装完新开一个会话让技能加载。
```

### Hermes

先 clone 仓库，再把 skill 文件夹复制进 Hermes 的 skills 目录：

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
cp -R ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder \
  ~/.hermes/skills/streamdock-plugin-builder
```

Hermes 下次启动会自动发现它。

**或者直接把下面这段提示词丢给 Hermes，让它自己装：**

```
帮我安装 StreamDock plugin-builder 技能，来源https://github.com/MiraboxSpace/StreamDock-Plugin-Builder ——clone 这个仓库，把里面的skills/streamdock-plugin-builder 文件夹复制到 ~/.hermes/skills/streamdock-plugin-builder（确保 ~/.hermes/skills/streamdock-plugin-builder/SKILL.md 存在），然后重新加载技能。
```

### 手动安装（任意智能体）

这个 skill 就是一个自包含文件夹：`skills/streamdock-plugin-builder/`（内含
`SKILL.md`、`references/`、`assets/`）。把它整个复制到对应智能体的目录：

- Claude Code：`~/.claude/skills/streamdock-plugin-builder/`
- Codex：`~/.codex/skills/streamdock-plugin-builder/`
- OpenClaw：`~/.openclaw/skills/streamdock-plugin-builder/`
- Hermes：`~/.hermes/skills/streamdock-plugin-builder/`

复制后，该目录顶层应直接有 `SKILL.md`（例如
`~/.hermes/skills/streamdock-plugin-builder/SKILL.md`）。

## 用法

安装后，直接用自然语言描述需求即可，例如：

> 帮我做一个 StreamDock 插件：按一下按键静音 / 取消静音，按键上显示当前状态。

智能体会自动加载本技能，按流程执行：厘清需求 → 从模板生成 → 实现逻辑 →
构建并安装到 StreamDock。

## 仓库结构

```
streamdock-plugin-builder/
├── .claude-plugin/
│   ├── marketplace.json      # Claude Code 插件市场清单
│   └── plugin.json           # Claude Code 插件清单
├── .codex-plugin/
│   └── plugin.json           # Codex 插件清单
└── skills/
    └── streamdock-plugin-builder/   # 技能本体 —— 一个自包含文件夹
        ├── SKILL.md          # 技能主文件（智能体入口）
        ├── references/       # 9 份参考文档
        └── assets/
            └── plugin-template/   # 完整可用的插件模板
```

四个智能体共用同一个 `skills/streamdock-plugin-builder/` 文件夹：Claude Code 和
Codex 通过各自的 `.claude-plugin/` / `.codex-plugin/` 清单发现它，OpenClaw 和
Hermes 则直接安装这个文件夹（见上文）。各自的清单文件互不影响。

## License

MIT
