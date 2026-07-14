<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=LLM%20API%20Setup%20Guides&fontSize=48&fontColor=fff&animation=fadeIn&fontAlignY=32&desc=%E4%B8%80%E6%8A%8A%20Key%EF%BC%8C%E7%8E%A9%E8%BD%AC%E6%89%80%E6%9C%89%20AI%20%E5%B7%A5%E5%85%B7&descSize=18&descAlignY=55" alt="LLM API Setup Guides" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=800&color=36BCF7&center=true&vCenter=true&width=600&lines=Cherry+Studio+%2F+Chatbox+%2F+Claude+Code+%E4%BF%9D%E5%A7%86%E7%BA%A7%E6%95%99%E7%A8%8B;3+%E5%88%86%E9%92%9F%E6%8E%A5%E5%85%A5%EF%BC%8C%E9%9B%B6%E6%88%90%E6%9C%AC%E8%B5%B0%E5%AE%8C%E5%85%A8%E7%A8%8B;%E6%8C%81%E7%BB%AD%E6%9B%B4%E6%96%B0%EF%BC%8C%E6%AC%A2%E8%BF%8E+Star+%E2%AD%90" alt="Typing SVG" />

<br/>

[![GitHub stars](https://img.shields.io/github/stars/18534516725/llm-api-setup-guides?style=for-the-badge&logo=github&color=FFD700)](https://github.com/18534516725/llm-api-setup-guides/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/18534516725/llm-api-setup-guides?style=for-the-badge&color=32CD32)](https://github.com/18534516725/llm-api-setup-guides/commits)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](https://github.com/18534516725/llm-api-setup-guides/pulls)

<br/>

[📖 教程目录](#-教程目录) &nbsp;·&nbsp; [🔑 快速开始](#quick-start) &nbsp;·&nbsp; [❓ 常见问题](#-常见问题所有工具通用) &nbsp;·&nbsp; [💬 交流群](#-交流与反馈)

</div>

---

## 💡 这个仓库解决什么问题

你是否遇到过:

- 🤔 下载了 Cherry Studio / Chatbox,打开一脸懵,不知道 API Key 往哪填
- 😤 网上教程零散过时,照着配完一堆 401 / 404 报错
- 💸 想用 Claude / GPT 写代码,却卡在海外信用卡和网络环境上
- 🔀 每个工具配置方式都不一样,换个客户端就要重新摸索一遍

**本仓库把主流 AI 工具的接入方式全部整理成统一格式的详细教程**:
每篇都包含安装、配置、首次验证、安全提醒和常见报错排查,持续更新。

> ✅ 教程全部按公开标准协议编写,覆盖 OpenAI Chat Completions、OpenAI Responses 和 Anthropic Messages。使用前请确认服务支持对应工具所需的协议,再替换 Base URL、Key 和模型 ID。

---

## 📖 教程目录

### 💻 桌面客户端

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Cherry Studio](./guides/cherry-studio.md)** | 全能桌面客户端,统一管理多个模型 | ⭐ | ✅ 已发布 |
| **[Chatbox](./guides/chatbox.md)** | 轻量简洁,本地优先,新手友好 | ⭐ | ✅ 已发布 |
| **LobeChat** | 高颜值 Web 客户端,插件生态丰富 | ⭐⭐ | 📅 计划中 |
| **NextChat** | 一键部署的经典选择 | ⭐⭐ | 📅 计划中 |
| **[Open WebUI](./guides/open-webui.md)** | Docker 自部署,支持多账户与多连接 | ⭐⭐⭐ | ✅ 已发布 |

### ⌨️ AI 编程工具

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **[Claude Code](./guides/claude-code.md)** | Anthropic 官方终端编程代理 | ⭐⭐ | ✅ 已发布 |
| **[Codex CLI](./guides/codex-cli.md)** | OpenAI 官方终端编程代理,支持 Responses API | ⭐⭐ | ✅ 已发布 |
| **Cursor** | 最火的 AI 编辑器 | ⭐⭐ | 📅 计划中 |
| **CC Switch** | Claude Code 多线路一键切换 | ⭐ | 📅 计划中 |

### 🧩 插件与平台

| 工具 | 说明 | 难度 | 状态 |
|:---|:---|:---:|:---:|
| **沉浸式翻译** | 全网最火的双语翻译插件 | ⭐ | 🚧 本周更新 |
| **Dify** | 低代码 AI 应用编排平台 | ⭐⭐⭐ | 📅 计划中 |
| **FastGPT** | 知识库问答平台 | ⭐⭐⭐ | 📅 计划中 |

> 📌 想要的工具不在列表里?[提个 Issue](https://github.com/18534516725/llm-api-setup-guides/issues) 告诉我,呼声高的优先写。

---

<a id="quick-start"></a>

## 🔑 开始之前:你需要一把 API Key

所有教程都需要 **Base URL + API Key + 准确的模型 ID**。不同工具使用的协议可能是 OpenAI Chat Completions、OpenAI Responses 或 Anthropic Messages,请以具体教程为准。获取途径任选:

| 途径 | 优点 | 门槛 |
|:---|:---|:---|
| **官方 API**<br>(OpenAI / Anthropic / Google) | 功能最全,第一手 | 海外信用卡 + 网络环境 |
| **聚合 / 中转服务** | 支付宝微信付款,国内直连,一把 Key 调多家模型 | 邮箱注册即可 |

本仓库教程示例使用 **[纽智中转站](https://www.nexotoken.net/?ref=github)** 演示。以下活动信息核验于 2026-07-14,后续规则以注册页和控制台实时展示为准:

- 🆓 新注册、未充值账户当前有每日 20 次免费额度,每日北京时间 00:00 重置
- 🧪 未充值账号当前可 **¥1 购买 300 积分**体验付费线路,适合低成本走完教程
- 📊 模型广场展示当前可用模型、价格与运行状态,并提供 Claude Code / Codex 兼容模型

> 💡 同一协议下的核心配置相近,但 Base URL、认证方式和模型能力仍可能不同。多比价、小额试用、按需选择,是这个领域的通用生存法则。

---

## ❓ 常见问题(所有工具通用)

<details>
<summary><b>🔴 报错 401 Unauthorized</b></summary>
<br/>

Key 复制不完整或已删除。回服务商后台重新复制完整 Key,注意首尾不要带空格。
</details>

<details>
<summary><b>🔴 报错 404 Not Found</b></summary>
<br/>

Base URL 填错。注意有的工具要填到 `/v1` 结尾,有的会自动补全,详见各工具教程中的填写说明。
</details>

<details>
<summary><b>🔴 提示"余额不足"但明明有免费额度</b></summary>
<br/>

部分服务的免费额度只在特定分组/模型生效。确认调用的模型在免费池内,或检查是否选对了分组。
</details>

<details>
<summary><b>🟡 响应很慢</b></summary>
<br/>

先换一个可用模型或稍后重试。若模型与服务商明确支持 prompt caching,长对话中的缓存读取通常比普通输入便宜,具体折扣与生效条件以当前价格文档为准。
</details>

---

## 💬 交流与反馈

- 🐛 教程有错、步骤过时 → [提 Issue](https://github.com/18534516725/llm-api-setup-guides/issues)
- ➕ 想补充其他工具的教程 → 欢迎 PR
- 💬 配置卡住了想找人问 → QQ 群 **822274386**,在线必回

## ⭐ Star History

如果这些教程帮到了你,点个 **Star** ⭐ 是最大的支持——也方便你下次换工具时找回这里。

[![Star History Chart](https://api.star-history.com/svg?repos=18534516725/llm-api-setup-guides&type=Date)](https://star-history.com/#18534516725/llm-api-setup-guides&Date)

## 📄 License

MIT · 教程可自由转载,注明出处即可

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer" alt="页面底部装饰" width="100%"/>

**由 [纽智中转站](https://www.nexotoken.net/?ref=github) 维护 · 持续更新中**

</div>
