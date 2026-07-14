# Spring AI 接入 OpenAI 兼容 API：Spring Boot 配置与生产排错

> 最后核验：2026-07-14
>
> 适用范围：Spring AI OpenAI SDK Chat Model 与 Spring Boot 自动配置
>
> 协议重点：使用官方 OpenAI Java SDK 集成，通过 Base URL、Key 和模型 ID 接入兼容服务

[← 返回教程目录](../../README.md)

> [!TIP]
> **需要给 Spring AI 配置一个 OpenAI 兼容接口？**
>
> **[纽智中转站](https://www.nexotoken.net/?ref=github)** 提供每天 20 次免费额度，新人 ¥1 得 300 积分，支持支付宝 / 微信直充。请从控制台复制 Base URL、Key 和模型 ID，活动规则以官网实时页面为准。
>
> **[👉 获取测试 Key](https://www.nexotoken.net/?ref=github)**

## 1. 适用场景

Spring AI 适合已有 Spring Boot 技术栈的项目：

- 使用 `ChatClient` 构建后端聊天接口；
- 通过 Spring 配置管理模型与 Key；
- 结合 Advisors、Tool Calling 和向量数据库；
- 复用 Actuator、配置中心和可观测性体系；
- 在测试与生产环境切换不同模型配置。

它不是协议转换器。目标服务需要兼容 Spring AI 实际发送的 OpenAI 请求。

## 2. 添加依赖

优先通过 Spring Initializr 或 Spring AI 官方 BOM 管理版本，不要自行拼接互不兼容的里程碑版本。

Maven 依赖：

```xml
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-starter-model-openai-sdk</artifactId>
</dependency>
```

Gradle：

```groovy
implementation "org.springframework.ai:spring-ai-starter-model-openai-sdk"
```

修改依赖后必须提交 Maven/Gradle 对应的版本管理与 lockfile（如果项目启用了依赖锁定）。

## 3. 使用环境变量保存 Key

```bash
export AI_API_KEY="YOUR_API_KEY"
export AI_BASE_URL="https://your-api.example.com/v1"
export AI_MODEL="YOUR_MODEL_ID"
```

OpenAI SDK 集成的 `base-url` 是 API 根地址，通常包含 `/v1`。不要填完整 `/chat/completions`，也不要根据旧版 Spring AI 教程增加当前配置中不存在的 `completions-path` 属性。

## 4. application.yml 配置

```yaml
spring:
  ai:
    openai-sdk:
      api-key: ${AI_API_KEY}
      base-url: ${AI_BASE_URL}
      chat:
        options:
          model: ${AI_MODEL}
```

控制台如果给出 `https://your-api.example.com/v1`，就原样作为 `AI_BASE_URL`。配置完成后应通过脱敏 HTTP 日志或服务端访问记录核对最终请求路径是：

```text
https://your-api.example.com/v1/chat/completions
```

不要把 `base-url` 写成完整聊天端点，否则 SDK 再追加资源路径时会出错。

## 5. 最小 ChatClient 接口

```java
package com.example.demo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiController {
    private final ChatClient chatClient;

    public AiController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @GetMapping("/internal/ai/health")
    public String health() {
        return chatClient.prompt()
                .user("只回复 OK")
                .call()
                .content();
    }
}
```

这个接口只适合本地验证。生产环境不能把付费模型接口作为无认证的公开 GET 接口。

## 6. 命令行验证

```bash
curl --fail-with-body http://localhost:8080/internal/ai/health
```

预期返回 `OK`。若应用启动成功但调用失败，查看 HTTP 状态码和最终请求 URL，不要在日志中输出完整认证头。

## 7. 流式输出

```java
import reactor.core.publisher.Flux;

@GetMapping(value = "/internal/ai/stream", produces = "text/event-stream")
public Flux<String> stream() {
    return chatClient.prompt()
            .user("用一句话解释 Spring AI")
            .stream()
            .content();
}
```

非流式正常、流式失败时，检查：

- 上游 SSE 格式；
- WebFlux 依赖与响应类型；
- Nginx / 网关缓冲；
- 负载均衡与读取超时；
- 客户端断开后的取消传播。

## 8. Tool Calling 验证

工具会执行本地 Java 代码，必须采用最小权限。先用无副作用函数：

```java
import java.time.ZonedDateTime;
import java.util.function.Function;

public record TimeRequest(String zoneId) {}
public record TimeResponse(String value) {}

public class TimeTool implements Function<TimeRequest, TimeResponse> {
    @Override
    public TimeResponse apply(TimeRequest request) {
        return new TimeResponse(
                ZonedDateTime.now(java.time.ZoneId.of(request.zoneId())).toString()
        );
    }
}
```

具体注册 API 会随 Spring AI 版本演进，请以当前官方 Tool Calling 文档为准。无论使用注解还是 Bean，都要验证工具 Schema、参数解析、执行结果回传和第二轮模型响应。

## 9. Embedding 与 RAG

聊天与 Embedding 是两条独立链路。配置知识库前确认：

- 服务实现 `/v1/embeddings`；
- Key 有 Embedding 模型权限；
- 使用准确 Embedding 模型 ID；
- 向量维度与数据库集合一致；
- 更换模型后重新索引；
- 文档切分、元数据和权限过滤正确。

不要因为 ChatClient 正常就默认 VectorStore 也能用。

## 10. 多环境配置

`application-dev.yml` 只保存非敏感默认值：

```yaml
spring:
  ai:
    openai-sdk:
      base-url: ${AI_BASE_URL}
      api-key: ${AI_API_KEY}
```

生产 Key 放在 Secret 管理、Kubernetes Secret 或配置中心的加密字段。不要把真实 Key 写入 Git 中的 `application-prod.yml`。

## 11. 常见错误

### 启动时报缺少 API Key

环境变量未注入，或配置前缀与当前 Spring AI 版本不一致。查看启动配置报告，但不要开启会打印 Secret 的调试输出。

### 401 / 403

检查 Key 是否有效、模型权限和环境变量来源。不要把 `Bearer ` 一起写进 `api-key`。

### 404

打印脱敏后的最终 URI，重点检查 `base-url` 是否包含正确 `/v1`，以及是否误填了完整聊天端点。

### 400 未知字段

恢复默认参数并关闭 Tool Calling、结构化输出和扩展选项，再逐项开启。兼容接口可能只实现协议子集。

### 429

降低并发，使用有上限的指数退避，并限制单用户请求频率。不要让 Web 请求线程无限等待。

### 5xx / Timeout

区分连接超时、读取超时和服务端错误；记录脱敏请求 ID。在熔断器中设置合理阈值，避免故障时形成重试风暴。

## 12. 生产安全清单

- [ ] 外部接口已认证和限流；
- [ ] Prompt 与附件有大小限制；
- [ ] Key 只在服务端 Secret 中；
- [ ] Actuator 端点未泄露环境变量；
- [ ] Tool 白名单与业务授权分离；
- [ ] 数据库写操作不由模型参数直接决定；
- [ ] 日志隐藏认证头、私人输入和内部错误；
- [ ] 超时、重试、熔断和并发上限已配置；
- [ ] 开发、测试、生产使用不同 Key；
- [ ] 有用量监控和异常告警。

## 13. 测试策略

- 单元测试：Mock ChatModel，验证业务 Prompt 和输出处理；
- 契约测试：用测试 Key 调最小文本、流式和 Tool Call；
- 集成测试：验证网关、限流、取消和错误映射；
- 回归测试：升级 Spring AI 后检查请求路径、字段和响应解析。

不要让每次单元测试都访问真实付费接口。

## 14. 升级与回滚

1. 记录 Spring Boot、Spring AI BOM 和 Java 版本；
2. 在测试分支升级；
3. 检查配置属性迁移；
4. 运行文本、流式、工具和 Embedding 契约测试；
5. 生产异常时恢复 BOM、构建文件和依赖锁定。

## 15. 官方资料

- [Spring AI：OpenAI Chat](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
- [Spring AI 1.1：OpenAI SDK Chat](https://docs.spring.io/spring-ai/reference/1.1/api/chat/openai-sdk-chat.html)
- [Spring AI：Chat Model API](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [Spring AI：Tool Calling](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [Spring AI 官方 GitHub](https://github.com/spring-projects/spring-ai)

先完成基础 Chat Completions 契约测试，再接入 Advisors、工具、向量库和业务工作流。
