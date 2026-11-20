# StreamDock & Craft Plugin Builder Skills

[English](README.md) | **中文**

一个仓库，包含三个独立的 **Agent Skills**，支持 Claude Code、Codex、
OpenClaw 和 Hermes：

| 技能 | 用途 | 模板 |
| --- | --- | --- |
| [streamdock-plugin-builder](skills/streamdock-plugin-builder/SKILL.md) | StreamDock 按键、旋钮、控制条和卡片插件 | Node.js 后端 + HTML 属性检查器 |
| [craft-plugin-builder](skills/craft-plugin-builder/SKILL.md) | MiraBox Craft 纯展示副屏组件 | 支持 Node.js 后端 + HTML 属性检查器、Vue 网页应用两种模板；默认使用 Node.js，也可指定 Vue |
| [syncrgb-effect-builder](skills/syncrgb-effect-builder/SKILL.md) | SyncRGB / Craft RGB 灯效动画 | HTML Canvas + meta 参数；画布固定 320×200，14 种语言 |

各技能分别提供模板、协议参考和开发安装流程。Craft Node 模板已包含
QWebChannel，以及实测修复的连接入口与设置消息路由。副屏展示用 Craft，
实体按键/旋钮交互用 StreamDock，不能混用事件和安装目录。

## 安装

### Claude Code（插件市场）

在 Claude Code 里依次执行：

```
/plugin marketplace add MiraboxSpace/StreamDock-Plugin-Builder
/plugin install streamdock-plugin-builder@streamdock-marketplace
```

第一行把本仓库登记为插件市场，第二行安装同时包含三套技能的插件。新开会话即生效。

### Codex（skill-installer）

在 Codex 里执行：

```
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/streamdock-plugin-builder
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/craft-plugin-builder
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/syncrgb-effect-builder
```

Codex 会调用官方脚本把 skill 装进 `~/.codex/skills/`。装完**重启 Codex**生效。

### OpenClaw

先 clone 仓库，再从本地路径安装该 skill：

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/craft-plugin-builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/syncrgb-effect-builder
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
cp -R ./StreamDock-Plugin-Builder/skills/craft-plugin-builder \
  ~/.hermes/skills/craft-plugin-builder
cp -R ./StreamDock-Plugin-Builder/skills/syncrgb-effect-builder \
  ~/.hermes/skills/syncrgb-effect-builder
```

Hermes 下次启动会自动发现它。

**或者直接把下面这段提示词丢给 Hermes，让它自己装：**

```
帮我安装 StreamDock plugin-builder 技能，来源https://github.com/MiraboxSpace/StreamDock-Plugin-Builder ——clone 这个仓库，把里面的skills/streamdock-plugin-builder 文件夹复制到 ~/.hermes/skills/streamdock-plugin-builder（确保 ~/.hermes/skills/streamdock-plugin-builder/SKILL.md 存在），然后重新加载技能。
```

上面的单技能提示词只安装 StreamDock；安装 Craft 时使用同一仓库中的
`skills/craft-plugin-builder`，目标文件夹名也用 `craft-plugin-builder`。
灯效技能使用 `skills/syncrgb-effect-builder`，目标文件夹为 `syncrgb-effect-builder`。
按需分别安装。

### 手动安装（任意智能体）

每个 skill 都是一个自包含文件夹：`skills/streamdock-plugin-builder/` 或
`skills/craft-plugin-builder/`、`skills/syncrgb-effect-builder/`（内含
`SKILL.md`、`references/`、`assets/`）。把它整个复制到对应智能体的目录：

- Claude Code：`~/.claude/skills/streamdock-plugin-builder/`
- Codex：`~/.codex/skills/streamdock-plugin-builder/`
- OpenClaw：`~/.openclaw/skills/streamdock-plugin-builder/`
- Hermes：`~/.hermes/skills/streamdock-plugin-builder/`

安装 Craft 时，将上面目标路径中的 `streamdock-plugin-builder` 替换为
`craft-plugin-builder`。各技能分别复制；不要携带生成的 `node_modules/`、
`build/`、`log/` 或旧 ZIP。

复制后，该目录顶层应直接有 `SKILL.md`（例如
`~/.hermes/skills/streamdock-plugin-builder/SKILL.md`）。

## 用法

安装后，直接用自然语言描述需求即可，例如：

> 帮我做一个 StreamDock 插件：按一下按键静音 / 取消静音，按键上显示当前状态。

> 帮我写一个抛硬币插件。属性检查器里可以选择抛几枚硬币（1–5 枚）。按下按键后播放约 800 ms 的 SVG 逐帧动画：硬币抛起、在最高点侧转、落地，最终在按键上直接显示每枚硬币的正反面结果（H 正面 / T 反面）。结果保留在按键上，直到下次抛硬币。

智能体会自动加载本技能，按流程执行：理清需求 → 从模板生成 → 实现逻辑 →
构建并安装到 StreamDock。

### Craft 开发流程

示例：“帮我做一个 Craft 时钟组件，可修改配色并随副屏缩放。”
默认使用 Node 模板；明确说“用 Vue 模板”时使用保留的
`assets/vue-template/`。Windows Node 插件需要 Craft >= 5.1.018.1021。
开发运行 `npm run dev`，安装后重启 Craft，测试属性检查器、缩放和多实例，
确认正常后再打包。完整步骤见 [Craft 技能](skills/craft-plugin-builder/SKILL.md)。
不要套用 StreamDock 的自动重载行为。

### StreamDock 开发流程（用户须知）

整个过程分两个阶段，了解这点能让你更顺畅地使用：

**阶段一 — dev 模式（反复迭代直到功能正常）**

智能体会运行 `npm run dev`，将一个轻量启动脚本安装到 StreamDock 的插件目录，
无需打包，StreamDock 会自动重载插件。

- **仅第一次**：智能体会提示你重启一次 StreamDock，让它识别新插件文件夹。
- **后续每次修改**：智能体运行 `npm run dev`，StreamDock 自动重载，
  无需再手动重启。
- 每次 `npm run dev` 结束后，智能体会请你**在 StreamDock 里测试插件并反馈结果**。
  改 → dev → 测，反复迭代直到你满意为止。

**阶段二 — 打包（确认没问题后）**

功能一切正常后，**主动告诉智能体**，例如：

> "没问题，打包吧。"  
> "好了，build 一下。"  
> "可以正式打包了。"

智能体这时才会运行 `npm run build`，将插件打包成单文件并安装，
StreamDock 自动重载。

> **为什么要单独打包？** dev 模式下的启动脚本直接运行源码，每次退出让
> StreamDock 重载，适合开发调试。正式打包会把所有依赖合并成一个文件，
> 插件能在没有开发环境的机器上稳定运行。**打包命令不会自动执行**，
> 需要你明确告知智能体才会进行。

## SyncRGB 灯效开发

示例：“做一个蓝色呼吸灯效，可以调颜色和速度。”
灯效使用独立 HTML Canvas 模板，不是 Dock 按键动作或 Craft 副屏组件。
画布实际尺寸只能是 **320×200**，不随窗口或 DPI 放大；独立 SVG 封面为 **240×240**。
效果文件夹名只使用
英文字母和数字，例如 `ColorWave`。meta 标签声明配置项，14 份扁平 JSON 翻译界面。

安装时读取 HotSpot/configuration.ini 中的 Craft 数据目录，将效果复制到
`SDModules/mRGB/RGB/<效果名>`；配置文件不存在时使用默认 Craft 数据目录。
默认 SyncRGB 的同名 RGB 目录若也存在，会再同步一份，重复目标自动去重。
灯效**没有开发版/正式版之分**，安装后重启软件即可识别。
同步生成 `.mRGBEffect` 安装包供分享：本质为 ZIP，文件直接位于包根目录，不套一层文件夹，也不保留 `.zip` 后缀。可在 [Space](https://space.mirabox.net/contentUpload) 发布供其他用户下载。
详见 [灯效技能](skills/syncrgb-effect-builder/SKILL.md)。

## 可分享的插件安装包

用户确认正常或明确要求正式版本后，Dock 和 Craft 模板的 `npm run build` 会完成正式构建、
本地安装，并在项目的 `release/` 目录同步生成插件安装包。
Dock 的 `.sdPlugin` 压缩包内包含一层同名文件夹；Craft 的 `.mPanelPlugin`
压缩包内直接放置 manifest.json，不套文件夹。两种文件均不带 `.zip` 后缀。
交付时提供安装包链接和实际安装目录，而不只提供编译产物。
开发版交付时会明确提醒测试并确认，不能作为正式安装包分享。

安装包可分享给其他用户，也可以在 [Space](https://space.mirabox.net/contentUpload)
上传发布，供其他用户下载使用。

## 仓库结构

```text
streamdock-plugin-builder/
├── .claude-plugin/       # 一个插件发现三套技能
├── .codex-plugin/        # 扫描 skills 目录
└── skills/
    ├── streamdock-plugin-builder/
    │   ├── SKILL.md
    │   ├── references/
    │   └── assets/plugin-template/
    ├── syncrgb-effect-builder/
    │   ├── SKILL.md
    │   ├── references/
    │   ├── scripts/effect.py
    │   └── assets/effect-template/ColorWave/
    └── craft-plugin-builder/
        ├── SKILL.md
        ├── references/   # Node 文档 + vue/
        └── assets/
            ├── plugin-template/       # 默认 Node 模板，含 QWebChannel
            └── vue-template/   # Vue 模板
```

为兼容已有安装，仓库名和插件 ID 不变，三个技能仍可以独立安装。
Claude Code 插件清单注册三个技能，Codex 扫描 skills 目录；
OpenClaw 和 Hermes 可按需安装其中一个或多个。

## License

MIT
