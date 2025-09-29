# 🔐 FHEVM Voting DApp

**隐私保护投票系统，使用完全同态加密 (FHEVM)**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/solidity-0.8.27-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/next.js-15.0.0-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5.3-blue.svg)](https://www.typescriptlang.org/)

## 📋 项目概述

这是一个基于 FHEVM (Fully Homomorphic Encryption Virtual Machine) 构建的隐私保护投票系统。利用完全同态加密技术，实现了投票过程的端到端隐私保护，确保投票数据在整个生命周期中保持加密状态。

### ✨ 核心特性

- 🔒 **隐私保护**: 使用 FHEVM 实现完全加密的投票
- 🗳️ **灵活投票**: 支持多选项投票和条件结果公布
- ⚡ **实时更新**: 投票进度和统计的实时显示
- 🌐 **多网络支持**: 支持本地 Hardhat 网络和 Sepolia 测试网
- 📱 **响应式设计**: 现代化的用户界面
- 🔍 **结果可视化**: 直观的投票结果展示

## 🏗️ 架构设计

### 后端 (fhevm-hardhat-template/)

**智能合约**:
- `VotingCore.sol` - 核心投票逻辑合约
- `ProposalManager.sol` - 提案管理合约
- `VotingAuth.sol` - 用户认证合约

**部署网络**:
- **Sepolia 测试网**:
  - VotingAuth: `0xC94a31eE711845EbC983423D88C5D93Df0f1Cb27`
  - VotingCore: `0x18E25788B499967D05a25cE51d87198600e8bE6E`
  - ProposalManager: `0xa53b091D64FFB5B2E6e8B24d26A95619ff98655C`
- **本地 Hardhat 网络**: 支持快速开发和测试

### 前端 (voting-dapp/)

**技术栈**:
- Next.js 15 (React 框架)
- TypeScript (类型安全)
- Tailwind CSS (样式)
- Ethers.js (区块链交互)
- MetaMask (钱包连接)

**功能模块**:
- 提案创建和管理
- 加密投票界面
- 实时投票统计
- 结果公布和可视化
- 投票历史记录

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn
- MetaMask 浏览器扩展
- Git

### 安装和运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/demattos-erminia/fhevm-voting-dapp.git
   cd fhevm-voting-dapp
   ```

2. **安装依赖**
   ```bash
   # 安装前端依赖
   cd voting-dapp
   npm install

   # 安装合约依赖
   cd ../fhevm-hardhat-template
   npm install
   ```

3. **启动本地开发环境**
   ```bash
   # 启动本地 Hardhat 网络 (在新终端)
   cd fhevm-hardhat-template
   npx hardhat node

   # 启动前端开发服务器 (在新终端)
   cd voting-dapp
   npm run dev
   ```

4. **访问应用**
   - 打开浏览器访问 `http://localhost:3000`
   - 连接 MetaMask 到本地网络 (`http://localhost:8545`)

## 🔧 开发指南

### 合约开发

```bash
cd fhevm-hardhat-template

# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到本地网络
npx hardhat deploy --network localhost

# 部署到 Sepolia
npx hardhat deploy --network sepolia
```

### 前端开发

```bash
cd voting-dapp

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 生成 ABI 文件
npm run genabi
```

## 📦 部署选项

### 静态文件部署

项目已配置为生成静态文件，支持部署到任何静态托管服务：

```bash
cd voting-dapp
npm run build  # 生成静态文件到 out/ 目录
```

**推荐平台**:
- [Vercel](https://vercel.com) - 最简单的部署方式
- [Netlify](https://netlify.com) - 强大的静态站点托管
- [GitHub Pages](https://pages.github.com) - 免费的 GitHub 集成

### 完整部署包

- 静态文件已压缩: `voting-dapp-static.tar.gz` (708KB)
- 详细部署指南: `voting-dapp/DEPLOYMENT.md`

## 🔐 隐私与安全

### FHE 加密特性

- **端到端加密**: 投票数据全程加密
- **零知识证明**: 可验证的计算结果
- **匿名投票**: 保护投票者隐私
- **条件公布**: 满足条件后公布结果

### 安全考虑

- 合约代码已通过安全审计
- 使用 OpenZeppelin 安全库
- 实施适当的访问控制
- 定期安全更新

## 📊 测试覆盖

```bash
# 运行合约测试
cd fhevm-hardhat-template
npx hardhat test

# 运行前端测试
cd voting-dapp
npm test
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Zama](https://www.zama.ai/) - FHEVM 技术和支持
- [OpenZeppelin](https://openzeppelin.com/) - 安全合约库
- [MetaMask](https://metamask.io/) - Web3 钱包支持
- [Next.js](https://nextjs.org/) - React 框架

## 📞 联系方式

- 项目维护者: [demattos-erminia](https://github.com/demattos-erminia)
- 邮箱: demattoserminia734@outlook.com

---

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**
