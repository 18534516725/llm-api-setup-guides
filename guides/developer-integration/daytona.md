# Daytona AI 代码沙箱完整教程

> 最后核验：2026-09-02
>
> 适用范围：Daytona Python SDK、Sandbox、进程、文件、Snapshot、网络限制与资源回收
>
> 预计用时：45～90 分钟

[← 返回教程目录](../教程总目录.md)

## 1. Daytona 是什么

Daytona 为 AI Agent 和开发工具提供隔离的可编程计算环境。每个 Sandbox 有自己的内核、文件系统、网络栈和资源配额，可通过 SDK、API 或 CLI 执行代码、操作文件、管理生命周期和制作 Snapshot。

适合：

- 运行模型生成的代码；
- 为编程 Agent 提供临时工作区；
- 大规模并行评测；
- 复用预装依赖的环境快照；
- 把高风险执行从应用主机隔离出去。

沙箱降低风险但不是“代码绝对安全”的保证。凭据、网络、挂载、内核、资源和结果导出都要纳入威胁模型。

## 2. 准备环境

创建 Daytona 账户和 API Key 后：

```bash
python3 -m venv .venv-daytona
source .venv-daytona/bin/activate
python -m pip install --upgrade pip
pip install daytona python-dotenv
```

`.env`：

```dotenv
DAYTONA_API_KEY=YOUR_API_KEY
```

不要把 `.env` 提交到 Git。生产环境用密钥管理器和短期身份。

## 3. 创建并清理第一个 Sandbox

`hello.py`：

```python
from daytona import Daytona


def main() -> None:
    daytona = Daytona()
    sandbox = daytona.create()

    try:
        response = sandbox.process.exec("python3 -c 'print(21 * 2)'")
        print(response.result)
    finally:
        daytona.delete(sandbox)


if __name__ == "__main__":
    main()
```

```bash
python hello.py
```

成功应输出 `42`，且控制台中不再残留运行 Sandbox。API 异常时 `finally` 也应执行清理。

## 4. 文件上传与执行

```python
source = b"print('hello from sandbox')\n"
sandbox.fs.upload_file(source, "workspace/main.py")

result = sandbox.process.exec("python3 workspace/main.py")
print(result.result)
```

上传前检查文件名、大小和类型；下载结果前再次校验路径，防止 Agent 通过软链接或路径逃逸读取不应导出的文件。

## 5. 命令执行边界

不要把用户输入直接拼接 Shell：

```python
# 危险：用户输入可改变命令结构
sandbox.process.exec(f"python3 analyze.py {user_input}")
```

优先把输入写入 JSON 文件或使用 SDK 的结构化参数能力，并在执行前校验：

- 允许的程序和参数；
- 工作目录；
- 最大运行时间；
- stdout / stderr 大小；
- 进程树与后台任务；
- 退出码和结果文件。

Sandbox 内部的命令注入仍然可能窃取该 Sandbox 中的数据或消耗资源。

## 6. 自定义镜像与资源

可以从镜像或声明式 Image 创建环境，配置 CPU、内存和磁盘。原则：

- 镜像固定不可变 digest；
- 使用非 root 用户；
- 移除无关编译器、网络工具和包管理器；
- 不在镜像层写入秘密；
- 扫描依赖与系统漏洞；
- 为任务设置最小资源和超时。

不同任务类型使用不同 Snapshot，不要让低权限任务继承含敏感工具的高权限环境。

## 7. Snapshot

准备一次、重复创建是大规模 Agent 的常用方式：

```python
sandbox = daytona.create()
sandbox.process.exec("pip install pandas==3.0.5")
sandbox.create_snapshot("python-data-v1")
```

随后从 Snapshot 创建 Sandbox。Snapshot 可能包含文件、缓存、历史和意外凭据，制作前执行清理和内容审计，并采用不可变版本名。

## 8. 生命周期和自动回收

常见状态包括运行、停止、暂停、归档和删除。不同状态的 CPU、内存、磁盘占用与计费可能不同。

为一次性任务配置：

- `auto_stop_interval`：空闲后停止；
- `auto_archive_interval`：停止后归档；
- `auto_delete_interval`：到期删除；
- 应用侧 finally 清理；
- 定时孤儿资源扫描。

自动回收是兜底，不替代正常成功 / 失败路径的显式清理。

## 9. 出站网络限制

不可信代码最重要的边界之一是网络：

```python
sandbox.update_network_settings(network_block_all=True)
```

或按需要选择一种白名单：

```python
sandbox.update_network_settings(
    domain_allow_list="pypi.org,files.pythonhosted.org"
)
```

`networkBlockAll`、CIDR Allow List 与 Domain Allow List 的组合规则和可用范围取决于组织 Tier，互斥参数不能同时设置。

默认开放互联网会允许恶意代码外传数据、下载二阶段载荷或扫描目标。安装依赖阶段与实际执行阶段最好使用不同网络策略。

## 10. Secret 管理

不要把宿主机完整环境变量复制进 Sandbox。为每个任务生成：

- 最小 Scope；
- 短有效期；
- 仅允许目标资源；
- 可审计和可撤销；
- 任务结束立即失效的凭据。

模型、用户代码和工具日志都不应获得平台管理员 Key。即使 Secret 通过环境变量注入，Sandbox 内进程通常仍可读取它。

## 11. 并行任务

大量任务使用 Snapshot 扇出：

```text
已审核 Snapshot
├─ Sandbox A：测试分片 1
├─ Sandbox B：测试分片 2
└─ Sandbox C：测试分片 3
```

为每个任务使用独立目录、身份和结果前缀；设置组织级并发和费用预算。聚合结果时不信任 Sandbox 生成的文件名、路径和 MIME 类型。

## 12. 与 Agent 框架集成

把 Sandbox 封装成少量高层 Tool：

- `write_workspace_file`；
- `run_tests`；
- `read_test_report`；
- `destroy_workspace`。

不要直接给模型一个无限制 Shell 后就认为隔离已完成。高层 Tool 可以限制命令、路径、输出和副作用，并提供可审计参数。

## 13. 可观测性

记录：

- Sandbox ID、任务 ID 和 Snapshot 版本；
- 创建、启动、暂停、停止、归档和删除时间；
- CPU、内存、磁盘和网络用量；
- 命令类别、退出码、超时和截断；
- 下载和导出文件的哈希；
- 脱敏错误与回收结果。

不要记录完整命令中的用户秘密、源码或环境变量。

## 14. 常见错误

### Sandbox 创建超时

检查区域、组织配额、Snapshot、镜像拉取和 SDK 超时。不要无上限并发重试。

### 无法访问依赖站点

检查组织 Tier 与 Sandbox 网络策略。自定义 Allow List 启用后，必要包仓库也要显式加入。

### 停止后仍占磁盘或计费

停止、暂停、归档在容器和 VM Sandbox 中的资源语义不同。根据官方 Limits 页面选择归档或删除。

### 任务结束后仍有 Sandbox

异常路径没有进入清理、删除超时或进程被强制终止。添加 TTL 与孤儿扫描作第二道防线。

### Snapshot 带入了秘密

制作前未清理环境文件、Shell 历史或缓存。立即撤销凭据、删除 Snapshot 并审查由它创建的所有 Sandbox。

## 15. 验收清单

- [ ] 每次任务使用独立 Sandbox 和最小身份；
- [ ] 命令、路径、输出大小与运行时间受限；
- [ ] 镜像固定 digest 且已扫描；
- [ ] Snapshot 制作前完成凭据和缓存清理；
- [ ] 出站网络默认拒绝或最小白名单；
- [ ] 高权限 Secret 不进入用户执行环境；
- [ ] 成功、失败、取消和超时均清理；
- [ ] TTL 与孤儿扫描已经配置；
- [ ] 并发、资源和费用有组织级上限；
- [ ] 导出文件经过路径、类型、大小和恶意内容检查。

## 16. 官方来源

- [Daytona 官方文档](https://www.daytona.io/docs/)
- [Daytona Python SDK](https://www.daytona.io/docs/en/python-sdk/)
- [Sandbox API](https://www.daytona.io/docs/en/python-sdk/sync/sandbox/)
- [网络限制](https://www.daytona.io/docs/en/network-limits/)
- [资源和配额](https://www.daytona.io/docs/limits)
- [Daytona 官方仓库](https://github.com/daytonaio/daytona)
