# Claude Code 和 Codex 换 API 接入后，怎样确认工作区里的改动真的完成了？

本指南补充 [Claude Code 配置](../coding-tools/claude-code.md) 和 [Codex CLI 配置](../coding-tools/codex-cli.md)。先按各客户端指南确认 Base URL、模型 ID、凭证和协议，再做这里的文件验收。示例可用于 [nexo 中转站](https://www.nexotoken.net/) 等接入场景。作者参与 NexoToken 运营。这里验证本地文件操作，未比较服务速度、价格或模型能力。

## 1. 建一个允许失败的测试目录

在已安装 Git 和 Python 3 的终端执行。使用临时目录能把实验和真实仓库分开，也不会把 API Key 写入文件。下面的 Git 作者信息只对这次提交生效。

```sh
demo_dir=$(mktemp -d)
cd "$demo_dir"
git init -q
printf '%s\n' 'alpha' 'beta' > input.txt
printf '%s\n' '这是只读样本' > notes.txt
git add input.txt notes.txt
git -c user.name=Demo -c user.email=demo@example.invalid commit -qm baseline
```

在该目录启动待验收的客户端。用同一段提示词测试每种配置，两个客户端分别从独立临时目录开始。

> 读取 input.txt，把每一行转成大写并保存到 output.txt。只创建 output.txt。不要修改 input.txt 或 notes.txt。完成后说明你实际写入了哪个文件。

如界面要求确认本地写入，按测试意图授权。保留原有权限限制。客户端回复「完成」后，还要回到终端核验磁盘状态。

## 2. 验证内容、改动范围和工作区

```sh
python3 - <<'PY'
from pathlib import Path
import subprocess

expected = b"ALPHA\nBETA\n"
output = Path("output.txt")
assert output.is_file() and not output.is_symlink(), "output.txt 未创建或不是预期的普通文件"
assert output.read_bytes() == expected, "输出与预期字节不同"
status = subprocess.check_output(
    ["git", "status", "--porcelain", "--untracked-files=all"], text=True
)
assert status.splitlines() == ["?? output.txt"], f"工作区改动超出预期：{status!r}"
print("PASS: 内容正确，且只新增 output.txt")
PY
```

如果验收失败，先保留脱敏的命令输出，再分情况处理。

| 看到的结果 | 优先查哪里 |
| --- | --- |
| 客户端直接返回认证或协议错误 | 回到对应客户端配置指南，检查接口类型和鉴权，再做最小请求 |
| 能聊天，文件不存在 | 看当前工作目录、工具权限和是否出现过审批提示 |
| 文件有了，内容不正确 | 查工具实际读到的输入，以及是否用文本回复代替了写入步骤 |
| 输出正确，原文件被改了 | 查客户端改动清单。把范围限制写进测试用例并保留失败记录 |

## 3. 单独检查拒绝写入的路径

另开干净目录，重复准备步骤。仅在客户端能明确拒绝写入或使用只读模式时执行这一轮。再次给相同任务，预期客户端如实指出未能写入，且目录没有 `output.txt`。若拒绝后仍有写入痕迹，先检查授权范围和日志，再接真实工作区。

## 4. 留一份可以复查的记录

每次仅改一项，例如接入配置或客户端版本，并记录客户端名称、版本、接口协议、测试目录结果和失败阶段。认证头、API Key 和业务文件内容不写进记录。两次都通过说明这些用例走通，复杂项目里的并发、长上下文和网络中断还需要单独验收。
