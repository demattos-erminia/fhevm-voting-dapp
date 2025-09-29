# FHEVM Voting DApp

一个基于Zama FHEVM的隐私保护投票系统，支持完全同态加密的投票功能。

## ✨ 特性

- 🔐 **隐私保护**: 投票内容全程加密，仅在满足条件时解密
- 🗳️ **灵活投票**: 支持单选、多选等多种投票类型
- ⏰ **时间控制**: 可设置投票开始/结束时间
- 📊 **结果可视化**: 投票结果图表展示
- 🔄 **模式切换**: 支持真实网络和本地mock模式
- 🎨 **美观界面**: 现代化的响应式UI设计

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- MetaMask 钱包（用于真实网络模式）

### 安装依赖

```bash
npm install
```

### 开发模式

#### Mock模式（推荐用于开发）
```bash
# 首先启动本地Hardhat节点
cd ../fhevm-hardhat-template
npm run node

# 然后启动前端（新终端）
cd ../voting-dapp
npm run dev
```

#### 真实网络模式
```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
voting-dapp/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 主页
│   │   └── globals.css     # 全局样式
│   ├── components/         # React组件
│   │   ├── ui/            # UI组件库
│   │   └── voting/        # 投票相关组件
│   ├── fhevm/             # FHEVM集成层
│   │   ├── internal/      # 内部实现
│   │   ├── fhevmTypes.ts  # 类型定义
│   │   └── useFhevm.tsx   # FHEVM Hook
│   ├── hooks/             # 自定义Hooks
│   │   └── wallet/        # 钱包相关Hooks
│   ├── lib/               # 工具函数
│   └── types/             # TypeScript类型
├── public/                # 静态资源
└── package.json
```

## 🔧 核心技术栈

### 前端框架
- **Next.js 15**: React全栈框架
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架

### 区块链集成
- **FHEVM**: 全同态加密虚拟机
- **Relayer SDK**: FHEVM中继器SDK
- **Ethers.js**: Ethereum交互库

### UI组件
- **Headless UI**: 无样式UI组件
- **Heroicons**: 图标库
- **Recharts**: 图表可视化

## 🎮 使用指南

### 1. 连接钱包

启动应用后，首先连接您的钱包：
- 点击"Connect MetaMask"按钮
- 批准连接请求
- 选择合适的网络（Sepolia测试网）

### 2. 选择运行模式

- **Mock模式**: 使用本地模拟环境，适合开发测试
- **真实网络模式**: 连接实际区块链网络

### 3. 进入投票系统

连接钱包后，点击"Enter Voting System"进入主界面。

## 🔒 隐私保护机制

### 投票加密
- 所有投票内容在提交时即被加密
- 链上存储的仅是密文，无法直接读取
- 使用FHEVM的全同态加密技术

### 结果解密
- 投票结果在投票结束后才能解密
- 支持设置最低投票人数阈值
- 由提案创建者或DAO控制解密权限

### 隐私保证
- 用户无法查看其他人的具体投票选择
- 只有在满足条件时才能看到汇总结果
- 支持匿名投票，保护用户隐私

## 🏗️ 架构设计

### 智能合约层
```
VotingCore.sol      # 核心投票逻辑
ProposalManager.sol # 提案管理
VotingAuth.sol      # 用户认证和权限
```

### 前端架构
```
Wallet Layer      # 钱包连接和签名
FHEVM Layer       # 加密操作和解密
UI Layer          # 用户界面和交互
State Management  # 状态管理和数据流
```

## 🧪 测试

```bash
# 运行测试
npm run test

# UI测试
npm run test:ui
```

## 📦 部署

### 本地部署
```bash
npm run build
npm run start
```

### 生产部署
推荐部署到Vercel、Netlify或其他支持Next.js的平台。

## 🤝 贡献指南

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用BSD-3-Clause-Clear许可证。

## 🙏 致谢

- [Zama](https://www.zama.ai/) - FHEVM技术提供者
- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

## 📞 联系方式

如有问题或建议，请提交Issue或Pull Request。

---

**注意**: 这是一个演示项目，请在生产环境中进行充分的安全审计。