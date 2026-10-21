---
title: E2B 中文教程：AI 代码沙箱、文件与生命周期管理
description: 使用 E2B Python SDK 创建沙箱、运行 Python 命令、读取结果并清理，说明模板、超时、网络和与 Daytona 的选择边界。
---

# E2B 中文教程：AI 代码沙箱、文件与生命周期管理

> 最后核验：2026-10-21。PyPI 核对：e2b 2.58.0，Python >=3.11。

[← 返回教程总目录](../教程总目录.md)

## E2B 解决什么问题

E2B 提供可编程隔离环境，让 Agent 在独立环境中运行代码与工具。适合临时计算、数据分析、测试和代码执行。沙箱 Key 与模型 Key 是两套凭证，计费也应分开估算。

本文先用命令运行标准 Python，不混用 `e2b` 与 `@e2b/code-interpreter` 等不同 SDK 的接口。

## 1. 安装与凭证

```bash
python3.12 -m venv .venv-e2b
source .venv-e2b/bin/activate
python -m pip install "e2b==2.58.0"
```

在官方服务创建账户并设置环境变量 `E2B_API_KEY`。不要把 Key 放入沙箱镜像或公开脚本。Windows 使用 `py -3.12` 创建和 PowerShell 激活。

## 2. 完整创建、执行和清理

保存为 `sandbox_demo.py`：

```python
from e2b import Sandbox


def main() -> None:
    sandbox = Sandbox.create()
    try:
        result = sandbox.commands.run("python -c 'print(20 + 22)'")
        print(result.stdout)
        if result.exit_code != 0:
            raise RuntimeError("沙箱命令执行失败")
    finally:
        sandbox.kill()


if __name__ == "__main__":
    main()
```

```bash
python sandbox_demo.py
```

验收：输出 42，命令退出码为零，并确认环境已终止。宿主程序被强制中断时 finally 不一定执行，因此仍需要服务端生命周期限制。

## 3. 用文件传入数据

```python
sandbox.files.write("/tmp/input.json", '{"values":[1,2,3]}')
result = sandbox.commands.run(
    "python -c \"import json; print(sum(json.load(open('/tmp/input.json'))['values']))\""
)
print(result.stdout)
```

示例在有效沙箱生命周期内运行。实际项目把固定程序和 JSON 输入分开，不把用户文字拼进 Shell。

## 4. 模板与依赖

每次临时安装大型依赖会增加启动时间。稳定任务可以使用官方 Template 工作流预装依赖，固定版本并记录模板 ID。镜像层和模板文件中不要存秘密。

模板更新后先跑固定输入，比较输出和依赖版本，再切换生产任务。

## 5. 暂停、恢复和终止

暂停保留状态，终止释放环境，两者语义不同。持久化方式、保留时间和成本以当前账户与官方说明为准。不能把“任务结束”自动等同于“所有关联资源已删除”。

为每项任务记录 sandbox ID、创建时间、负责人和最终清理状态，定期找出异常残留。

## 6. 网络和凭证

只传任务必需的短期凭证，避免把宿主环境变量全部复制进去。限制访问范围，检查下载文件大小与类型。没有网络限制的沙箱仍然可能把其中的数据发出。

处理来自模型的代码时，限制运行时间、CPU / 内存、输出大小和下载路径，防止资源消耗与数据泄露。

## 7. 与 Daytona 怎么选

二者都能提供 Agent 执行环境。用你的实际任务比较创建时间、模板构建、文件 I/O、网络配置、可观测性、地区和计费，不引用不同环境下的启动数字做排名。

已有 [Daytona 教程](daytona.md) 可作为另一条实现路径。不要把两个 SDK 的 `delete`、`kill` 或文件方法互相照搬。

## 8. 常见问题

| 问题 | 检查 |
|---|---|
| 401 | E2B Key 和账户权限 |
| 创建失败 | 配额、模板、区域和网络 |
| 命令超时 | 程序耗时、后台进程、任务时间限制 |
| 文件不存在 | 绝对路径、工作目录、沙箱是否已终止 |
| 费用持续增长 | 暂停 / 运行状态、清理失败和残留任务 |

## 官方来源

- [E2B 官方文档](https://docs.e2b.dev/)
- [E2B 官方项目](https://github.com/e2b-dev/E2B)
- [e2b 2.58.0](https://pypi.org/project/e2b/2.58.0/)
