# 🚀 SmartPantry Android APK 部署指南

## ✅ 已完成配置

1. ✅ Capacitor 已安装并配置
2. ✅ Android 平台已添加
3. ✅ GitHub Actions 自动构建已设置
4. ✅ 代码已推送到 GitHub

## 📱 获取 APK 文件

### 方法 1：从 GitHub Releases 下载（推荐）

1. 访问 GitHub Actions 页面：
   ```
   https://github.com/shawHuaZe/smartpantry/actions
   ```

2. 等待构建完成（大约 5-10 分钟）

3. 构建完成后，访问 Releases 页面：
   ```
   https://github.com/shawHuaZe/smartpantry/releases
   ```

4. 下载最新的 APK 文件：
   - `app-debug.apk` - 调试版本（用于测试）
   - `app-release.apk` - 发布版本（推荐使用）

5. 将 APK 传输到 Android 手机并安装

### 方法 2：从 GitHub Actions Artifacts 下载

1. 访问 GitHub Actions：
   ```
   https://github.com/shawHuaZe/smartpantry/actions/workflows/build-android.yml
   ```

2. 点击最新的构建任务

3. 在页面底部找到 "Artifacts" 部分

4. 下载：
   - `smartpantry-debug` - Debug APK
   - `smartpantry-release` - Release APK

## 📲 在手机上安装 APK

### 安装步骤

1. **下载 APK** 到手机（使用上述方法）

2. **允许安装未知来源应用**：
   - 进入手机设置 → 安全
   - 启用"允许安装未知来源应用"或"来自此来源的应用"

3. **打开文件管理器**，找到下载的 APK 文件

4. **点击安装**

5. **首次打开时授予权限**：
   - 相机权限（拍照识别）
   - 存储权限（保存图片）
   - 网络权限（连接后端 API）

## 🔧 配置后端 API

应用启动时会自动连接配置的后端 API 地址（已在环境变量中设置）。

如果需要修改 API 地址：

1. 编辑 `android/app/src/main/assets/capacitor.config.json`

2. 修改 `server.url` 为你的后端地址：
   ```json
   {
     "server": {
       "url": "https://your-backend-url.com",
       "cleartext": true
     }
   }
   ```

3. 重新构建 APK

## 🛠️ 重新构建 APK

### 自动构建（推荐）

推送代码到 `main` 分支，GitHub Actions 会自动构建：

```bash
git add .
git commit -m "Update app"
git push origin main
```

### 手动构建

在本地构建需要安装：
- JDK 17
- Android SDK
- Gradle

构建命令：
```bash
# 构建前端
npm run build

# 同步到 Android
npx cap sync android

# 构建 Debug APK
cd android
./gradlew assembleDebug

# 构建 Release APK
./gradlew assembleRelease

# APK 文件位置
ls android/app/build/outputs/apk/debug/app-debug.apk
ls android/app/build/outputs/apk/release/app-release.apk
```

## 📝 应用信息

- **应用名称**：SmartPantry
- **包名**：com.smartpantry.app
- **版本**：基于 git commit hash 自动生成
- **权限**：
  - 网络访问
  - 相机
  - 存储读写
  - 媒体读取

## 🎯 下一步

### 可选优化

1. **自定义应用图标**
   - 替换 `android/app/src/main/res/mipmap-*/ic_launcher.png`

2. **修改应用名称**
   - 编辑 `android/app/src/main/res/values/strings.xml`

3. **签名发布版本**
   - 生成签名密钥
   - 配置 `android/app/build.gradle`

4. **发布到应用商店**
   - Google Play Store
   - 国内应用商店（小米、华为等）

## 🔍 故障排查

### APK 无法安装

- 检查是否允许安装未知来源应用
- 确保手机 Android 版本 ≥ 6.0
- 尝试删除旧版本后重新安装

### 应用无法连接后端

- 确认后端服务正常运行
- 检查 API 地址配置
- 查看应用日志（使用 Android Studio）

### 构建失败

- 检查 GitHub Actions 日志
- 确保 `package.json` 和 `capacitor.config.ts` 配置正确
- 验证所有依赖已正确安装

## 📞 支持

如有问题，请访问：
- GitHub Issues: https://github.com/shawHuaZe/smartpantry/issues
- GitHub Actions: https://github.com/shawHuaZe/smartpantry/actions
