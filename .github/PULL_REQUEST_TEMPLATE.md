# Pull Request 检查清单

## 修改内容

<!-- 说明新增、修正或删除了哪些教程内容，以及为什么需要修改。 -->

## 官方依据

<!-- 列出用于核验关键步骤的官方文档、官方仓库或官方发布说明。 -->

- 请填写官方链接

## 验证结果

- [ ] 已运行 `node --test tests/*.test.mjs`
- [ ] 已运行 `node scripts/validate-docs.mjs`
- [ ] 已运行 `mkdocs build --strict`
- [ ] 涉及界面变化时已附脱敏截图
- [ ] README、教程总目录、导航或兼容性矩阵已按需同步

## 安全自检

- [ ] 没有提交真实 API Key、Cookie、Token、私人日志或用户数据
- [ ] 没有披露内部供应商、内部渠道、非公开路由或未经脱敏的错误
- [ ] 示例使用 `YOUR_API_KEY`、`sk-your-key` 等明显占位符
