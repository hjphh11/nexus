# Nexus - 全栈资源分析与讨论平台

科技感视觉风格的全栈 Web 平台，支持资源分享、技术论坛、用户认证、仪表盘、后台管理等完整功能。

## 功能特性

### 用户系统
- **注册/登录** - 支持邮箱注册登录，滑块人机验证，登录验证码保护
- **个人信息** - 头像上传、编辑资料、修改密码、通知偏好设置
- **权限控制** - USER / ADMIN 双角色，中间件路由保护

### 资源广场
- **资源上传** - 支持文件上传、图片展示、网盘链接分享（含提取码）
- **批量上传** - 一次性上传多个资源文件
- **资源浏览** - 类型筛选、排序、分页、搜索
- **资源详情** - 图片轮播、文件下载、浏览计数、评论互动

### 技术论坛
- **版块系统** - 多版块分类，管理员可动态创建/删除
- **发帖讨论** - 支持文件附件和图片附件，Tag 标签
- **回复评论** - 多层级评论回复、帖子点赞（粒子动画效果）
- **置顶/锁定** - 帖子置顶和锁定管理

### 个人仪表盘
- **数据统计** - 我的资源、帖子、点赞数据概览，CountUp 数字动画
- **资源管理** - 编辑、删除自己的资源，管理图片附件
- **动态时间线** - 最近帖子和评论活动记录

### 后台管理
- **总览面板** - 平台实时统计：用户数、资源数、浏览量、下载量、存储空间
- **用户管理** - 搜索用户、角色修改（即时生效）、删除用户
- **资源管理** - 搜索筛选、类型过滤、删除资源
- **论坛管理** - 版块增删、帖子管理

### 全局功能
- **全局搜索** - `Ctrl+K` 快捷唤起，跨资源和帖子实时搜索
- **通知系统** - 实时通知铃铛，未读计数，标记已读

### 视觉特效
- **3D 线框球体** - Three.js 粒子球，鼠标跟随旋转，滚轮缩放，滚动散开
- **粒子背景** - Canvas 粒子系统，科技感动态背景
- **霓虹卡片** - GSAP 驱动的 hover 发光效果，玻璃态材质
- **故障文字** - GlitchText 故障艺术效果
- **全息倾斜** - 鼠标跟随 3D 倾斜卡片
- **滚动揭示** - GSAP ScrollTrigger 滚动入场动画
- **六边形网格** - 科幻风格的六边形背景
- **电路线条** - SVG 电路图案装饰
- **终端预览** - 终端风格 UI 组件

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 + tw-animate-css |
| 数据库 | SQLite + Prisma 5 |
| 认证 | NextAuth.js v5 (Auth.js) |
| 动画 | Framer Motion + GSAP + ScrollTrigger |
| 3D | Three.js + React Three Fiber + Drei |
| 验证码 | rc-slider-captcha (滑块拼图) |
| 图标 | Lucide React |
| 密码 | bcryptjs |
| 组件 | shadcn/ui + Base UI |

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装运行

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 管理员账号

首次启动后，注册一个账号，然后手动在数据库中修改 `role` 字段为 `ADMIN`：

```bash
npx prisma studio
```

在 User 表中将目标用户的 `role` 改为 `ADMIN` 即可获得后台管理权限。

## 项目结构

```
src/
├── actions/          # Server Actions（认证、论坛、资源、搜索等）
├── app/              # Next.js App Router 页面
│   ├── admin/        # 后台管理（总览/用户/资源/论坛）
│   ├── api/          # API Routes（上传/资源编辑/头像）
│   ├── auth/         # 登录/注册页面
│   ├── dashboard/    # 个人仪表盘
│   ├── forum/        # 论坛（版块/帖子详情）
│   ├── resources/    # 资源广场（列表/详情）
│   ├── search/       # 搜索结果页
│   ├── settings/     # 用户设置
│   └── upload/       # 资源上传
├── auth.ts           # NextAuth 配置
├── components/
│   ├── effects/      # 视觉特效组件（3D球/粒子/动画）
│   ├── forum/        # 论坛组件（点赞按钮）
│   ├── layout/       # 布局组件（导航/侧栏/搜索/通知）
│   ├── providers/    # Session Provider
│   └── ui/           # 基础 UI 组件
├── lib/              # 工具库（数据库/验证码/工具函数）
└── middleware.ts      # 路由权限中间件
```

## 配置

环境变量（`.env`）：

```env
AUTH_SECRET="your-auth-secret"
DATABASE_URL="file:../prisma/dev.db"
```

## 许可

MIT
