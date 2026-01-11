# 🚀 SmartPantry 后端 Render 部署指南

## 📋 部署前准备

### 1. 确保你已拥有：
- ✅ GitHub 账号
- ✅ Render 账号（访问 https://render.com 注册）
- ✅ Supabase 项目（数据库和 API 密钥）
- ✅ 阿里云 DashScope API Key

---

## 🎯 方法一：使用 render.yaml 自动部署（推荐）

### 步骤 1：代码已准备完成

项目已包含 `render.yaml` 配置文件，Render 会自动识别。

### 步骤 2：在 Render 创建服务

1. 访问 https://dashboard.render.com/
2. 点击 **"New +"** 按钮
3. 选择 **"New Web Service"**
4. 连接 GitHub 账号并选择 `shawHuaZe/smartpantry` 仓库
5. Render 会自动检测 `render.yaml` 配置

### 步骤 3：配置环境变量

在 **Environment** 部分，添加以下环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `SUPABASE_URL` | 你的 Supabase URL | 例如：https://xxxxx.supabase.co |
| `SUPABASE_ANON_KEY` | 你的 Supabase Anon Key | 从 Supabase 控制台获取 |
| `JWT_SECRET` | 随机字符串（自动生成） | 用于 JWT 签名 |
| `DASHSCOPE_API_KEY` | 你的阿里云 API Key | 用于 AI 功能 |

### 步骤 4：部署

1. 点击 **"Create Web Service"**
2. 等待部署完成（约 2-3 分钟）
3. 部署成功后，Render 会提供 API 地址，例如：
   ```
   https://smartpantry-api.onrender.com
   ```

---

## 🎯 方法二：手动配置部署

如果自动部署失败，可以使用手动配置：

### 步骤 1：创建 Web Service

1. 访问 https://dashboard.render.com/
2. 点击 **"New +"** → **"Web Service"**
3. 连接 GitHub 并选择 `shawHuaZe/smartpantry` 仓库

### 步骤 2：配置构建和启动

在 **Build & Deploy** 部分填写：

| 字段 | 值 |
|------|-----|
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 步骤 3：配置环境变量

添加以下环境变量：

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | 你的 Supabase URL |
| `SUPABASE_ANON_KEY` | 你的 Supabase Anon Key |
| `JWT_SECRET` | 任意随机字符串 |
| `DASHSCOPE_API_KEY` | 你的阿里云 API Key |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### 步骤 4：部署并获取 URL

1. 点击 **"Create Web Service"**
2. 等待部署完成
3. 记下你的 API 地址，例如：
   ```
   https://smartpantry-api.onrender.com
   ```

---

## 🔄 获取 API 地址

部署成功后：

1. 在 Render 控制台进入你的服务
2. 在顶部找到 **"URL"** 字段
3. 复制这个地址，格式类似：
   ```
   https://smartpantry-api.onrender.com
   ```

---

## 📱 更新前端配置

### 方法 1：在 Vercel 更新环境变量

1. 访问 Vercel 项目 → **Settings** → **Environment Variables**
2. 找到或添加 `VITE_API_URL`
3. 更新值为你的 Render API 地址：
   ```
   https://smartpantry-api.onrender.com
   ```
4. 重新部署 Vercel 项目

### 方法 2：在本地更新并推送

编辑项目根目录的 `.env` 文件（如果本地开发需要）：
```bash
VITE_API_URL=https://smartpantry-api.onrender.com
```

**注意**：前端代码已使用 `import.meta.env.VITE_API_URL`，所以只需配置环境变量即可。

---

## 🔄 更新 Android APK 配置

如果需要重新生成 APK：

1. 编辑 `android/app/src/main/assets/capacitor.config.json`
2. 修改 `server.url` 为 Render API 地址
3. 推送代码到 GitHub：
   ```bash
   git add .
   git commit -m "Update API URL"
   git push origin main
   ```
4. GitHub Actions 会自动构建新 APK

---

## ✅ 部署验证

部署完成后，验证 API 是否正常工作：

```bash
# 测试健康检查（如果有）
curl https://smartpantry-api.onrender.com/

# 测试注册接口
curl -X POST https://smartpantry-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

---

## 📊 监控和日志

### 查看日志

1. 进入 Render 控制台
2. 选择你的服务
3. 点击 **"Logs"** 标签
4. 实时查看应用日志

### 自动部署

Render 支持：
- **自动部署**：每次推送到 `main` 分支自动重新部署
- **手动部署**：点击 "Manual Deploy" 按钮

---

## 🔧 常见问题

### 1. 部署失败

**检查项**：
- 确认 Root Directory 设置为 `server`
- 确认所有环境变量已配置
- 查看部署日志获取错误详情

### 2. API 无法访问

**解决方法**：
- 等待几分钟让服务完全启动
- 检查 Render 服务状态是否为 "Live"
- 确认端口设置为 3001

### 3. 环境变量错误

**检查**：
- SUPABASE_URL 格式是否正确（应该以 https:// 开头）
- API Key 是否复制完整
- JWT_SECRET 是否已设置

### 4. AI 功能不工作

**检查**：
- DASHSCOPE_API_KEY 是否正确
- 是否有足够的 API 配额
- 查看后端日志确认错误信息

---

## 💰 成本说明

Render 免费套餐：
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ 15GB 流量/月
- ⚠️ 15 分钟无请求后自动休眠
- ⚠️ 冷启动需要约 30 秒

付费套餐（如需 24/7 运行）：
- $7/月 起
- 更好的性能
- 无休眠

---

## 🎉 完成部署

部署完成后：

1. ✅ 后端 API 运行在 Render
2. ✅ 前端已连接到后端
3. ✅ 可以开始使用 SmartPantry
4. ✅ Android APK 可以下载安装

---

## 📞 获取帮助

- Render 文档：https://render.com/docs
- Render 状态页：https://status.render.com
- GitHub Issues：https://github.com/shawHuaZe/smartpantry/issues
