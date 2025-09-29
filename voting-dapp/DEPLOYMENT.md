# FHEVM Voting DApp - 静态部署指南

## 📦 静态文件已生成

前端应用已成功打包为静态文件，可以部署到任何静态托管服务。

### 📁 生成的文件

- **输出目录**: `out/` - 包含所有静态文件
- **压缩包**: `voting-dapp-static.tar.gz` - 708KB 的部署包

### 📊 文件统计

- 总文件数: 35个文件
- 总大小: 2.2MB (压缩后 708KB)

## 🚀 部署选项

### 1. Vercel (推荐)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署到 Vercel
vercel --prod

# 或者直接拖拽 out/ 文件夹到 Vercel 控制台
```

### 2. Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署到 Netlify
netlify deploy --prod --dir=out

# 或者直接拖拽 out/ 文件夹到 Netlify 控制台
```

### 3. GitHub Pages

```bash
# 如果项目在 GitHub 上
npm install -g gh-pages

# 部署到 GitHub Pages
gh-pages -d out
```

### 4. 其他静态托管服务

- **Surge**: `surge out/`
- **Firebase**: `firebase deploy`
- **AWS S3 + CloudFront**
- **传统 Web 服务器** (Apache/Nginx)

## ⚠️ 重要注意事项

### 🔐 Web3 功能限制

由于这是静态站点，以下功能可能需要特殊配置：

1. **MetaMask 连接**: 需要 HTTPS 环境
2. **区块链交互**: 某些 RPC 调用可能受 CSP 限制
3. **本地存储**: 可能需要配置适当的权限

### 🌐 推荐部署环境

- **生产环境**: 使用 HTTPS 的域名
- **开发测试**: 可以使用 `serve` 命令本地测试

```bash
# 本地测试静态文件
npx serve out/

# 或者使用 Python
python -m http.server 3000 -d out/
```

## 🔧 构建配置

### Next.js 配置 (next.config.ts)

```typescript
const nextConfig = {
  output: 'export',        // 启用静态导出
  trailingSlash: true,     // 确保路由兼容性
  images: {
    unoptimized: true      // 静态导出不支持图片优化
  }
};
```

### 重新构建

```bash
# 清理并重新构建
rm -rf out/ .next/
npm run build
```

## 📋 部署清单

- [x] 合约部署到 Sepolia
- [x] 前端静态文件生成
- [x] 合约地址更新
- [ ] 选择托管服务
- [ ] 部署静态文件
- [ ] 测试 Web3 功能
- [ ] 配置自定义域名 (可选)

## 🔗 已部署合约地址 (Sepolia)

| 合约 | 地址 |
|------|------|
| VotingAuth | 0xC94a31eE711845EbC983423D88C5D93Df0f1Cb27 |
| VotingCore | 0x18E25788B499967D05a25cE51d87198600e8bE6E |
| ProposalManager | 0xa53b091D64FFB5B2E6e8B24d26A95619ff98655C |

## 🎯 下一步

1. 选择一个静态托管服务
2. 上传 `out/` 目录中的文件
3. 测试应用功能
4. 配置 HTTPS (如果需要)

## 📞 支持

如果部署过程中遇到问题，请检查：

1. 浏览器控制台错误
2. 网络请求失败
3. MetaMask 连接问题
4. CSP (内容安全策略) 限制
