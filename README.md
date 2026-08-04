# Campaign Studio

面向营销团队的活动页低代码搭建器。运营人员可以基于模板和营销组件快速完成活动页编排，前端同学负责组件、Schema、预览和静态资源导出能力维护。

当前版本定位为公司内部 MVP，适合制作限时促销、新品发布、活动报名等 H5 营销页面。页面数据以结构化组件树保存，不依赖后端即可完成编辑、预览和静态项目导出。

## 项目能力

- 模板中心：内置促销活动、新品发布、报名收集模板，也支持保存自定义模板。
- 组件编排：文字、图片、按钮、表单、倒计时、优惠券、抽奖、商品卡片、弹窗和分享按钮。
- 视觉编辑：选中组件后直接拖拽，支持同级排序、虚影占位、多选、复制、删除、上下移动和撤销重做。
- 响应式预览：手机、平板、桌面三种画布尺寸，并支持组件级样式覆盖。
- 营销配置：页面标题、描述、分享信息、图片上传、事件动作和内容区块间距配置。
- 发布交付：发布预览、导出独立 HTML、导出可部署 ZIP，用户上传图片会进入 `assets/images`。
- 质量检查：导出前执行 Schema 和资源检查，生成 `QA-CHECKLIST.md` 和 `manifest.json`。

## 技术结构

```text
apps/
  console/                  编辑器控制台
    src/components/editor/  画布、属性面板、模板中心、组件面板
    src/stores/editor.ts    编辑器状态、草稿、撤销重做、模板应用
    src/templates.ts        内置模板定义
    src/exportPage.ts       HTML、ZIP 和资源打包
  page-runtime/             独立活动页运行时

packages/
  schema/                   页面 Schema、节点类型、校验和迁移
  components/               营销组件注册表和组件实现
  component-runtime/        组件定义和运行时基础能力

QA-CHECKLIST.md             导出质量检查说明
.gitignore                  常见本地、构建和编辑器文件忽略规则
```

## 本地开发

环境要求：Node.js 18+、pnpm 10+。

```bash
pnpm install
pnpm dev
```

编辑器地址：<http://localhost:5173>

单独启动活动页运行时：

```bash
pnpm dev:runtime
```

运行时地址：<http://localhost:5180>

## 常用命令

```bash
pnpm typecheck       # 全仓库 TypeScript 和 Vue 类型检查
pnpm build           # 构建控制台和活动页运行时
pnpm dev             # 启动编辑器开发服务
pnpm dev:runtime     # 启动独立活动页运行时
```

提交代码前至少执行：

```bash
pnpm typecheck
pnpm build
```

## 日常使用流程

1. 打开编辑器，默认进入模板中心第一个模板“限时促销”。
2. 在模板中心选择业务场景，或保存当前页面为自定义模板。
3. 在组件面板新增内容，在右侧属性面板完成文案、图片、样式和事件配置。
4. 使用手机、平板、桌面切换检查响应式效果。
5. 点击“预览模式”检查用户侧页面，点击“发布预览”检查发布版本。
6. 导出项目 ZIP，按导出报告处理 `FAIL` 和 `WARN` 项。
7. 将导出目录交给部署人员，发布到静态文件服务器或 CDN。

## 模板和 Schema 约定

页面由 `PageSchema` 描述，根节点类型为 `page`，营销内容放在 `section` 内，组件通过 `children` 形成结构化树。

新增或调整内置模板时：

- 优先复用 `packages/schema` 中已有的 `createNode` 和 `NodeType`。
- 模板必须包含完整转化路径：主张、利益点、行动按钮和结果收集入口。
- 图片必须提供 `alt`，表单必须配置字段，按钮文案不能为空。
- 模板名称、分类和描述要面向营销人员，不使用内部技术术语。
- 修改 Schema 结构时同步更新迁移逻辑和导出校验。

## 导出和上线

编辑器中的“导出项目 ZIP”会生成类似下面的静态项目：

```text
活动名称-v1-时间戳/
  index.html
  assets/
    styles.css
    runtime.js
    images/
  README.md
  QA-CHECKLIST.md
  manifest.json
```

部署时将整个目录上传到静态服务器，确保 `index.html` 与 `assets/` 保持相对路径关系。远程图片会继续使用原 URL；通过编辑器上传的图片会被写入 ZIP 的 `assets/images`。

## 当前边界

- 草稿、模板和发布数据暂存在浏览器 `localStorage`，尚未接入账号、权限和后端存储。
- 组件拖拽第一版只支持同级排序，不支持跨内容区块改变父子层级。
- 表单提交、线索收集、埋点和营销接口目前只提供前端配置与静态运行时演示。
- 图片远程地址依赖源站可访问性，正式上线建议使用公司 CDN 或导入本地资源。

## 协作约定

- 组件行为和页面结构优先通过 Schema 表达，避免在编辑器组件中写业务数据特例。
- 公共组件放在 `packages/components`，编辑器交互放在 `apps/console`。
- 面向用户的变化需要同步检查编辑器、预览模式、发布预览和 ZIP 导出四条链路。
- 不提交 `node_modules`、构建产物、个人环境文件和本地草稿。
- PR 描述应包含变更范围、验证命令和已知限制。
