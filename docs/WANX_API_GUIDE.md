# 通义万相 (WanX) 图片生成API使用指南

## 重要说明

⚠️ **您的API Key不支持同步调用，必须使用异步模式！**

错误信息：`current user api does not support synchronous calls`

## 解决方案

系统已自动使用**异步API模式**，包含以下步骤：

1. **提交异步任务** → 获取 task_id
2. **轮询查询结果** → 每2秒查询一次，最多等待2分钟
3. **返回图片URL** → 生成成功后返回图片地址

## 测试API

### 运行测试脚本

```bash
cd server
npm run test:wanx
```

### 测试内容

测试脚本会自动测试以下内容：

1. ✅ 异步调用 - 提交图片生成任务
2. ✅ 获取 task_id
3. ✅ 查询任务状态

### 查询任务结果

如果测试返回了 task_id，可以使用以下命令查询结果：

```bash
node test-wanx.js check <task_id>
```

例如：
```bash
node test-wanx.js check f5c84e4e-f60d-40ae-bd99-70437215a380
```

## API调用流程

### 1. 提交任务

```javascript
POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
  X-DashScope-Async: enable  ⬅️ 关键：必须设置此头部

Body:
{
  "model": "wanx-v1",
  "input": {
    "prompt": "A red apple on white background, product photography"
  },
  "parameters": {
    "size": "1024*1024",
    "n": 1,
    "seed": 123456
  }
}
```

### 2. 响应（提交成功）

```json
{
  "request_id": "...",
  "output": {
    "task_id": "f5c84e4e-f60d-40ae-bd99-70437215a380",
    "task_status": "PENDING"
  }
}
```

### 3. 查询任务状态

```javascript
GET https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis/{task_id}
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
```

### 4. 响应（任务进行中）

```json
{
  "request_id": "...",
  "output": {
    "task_id": "...",
    "task_status": "RUNNING"  // 或 PENDING
  }
}
```

### 5. 响应（任务完成）

```json
{
  "request_id": "...",
  "output": {
    "task_id": "...",
    "task_status": "SUCCEEDED",
    "results": [
      {
        "url": "https://dashscope-result-xxx.oss-cn-beijing.aliyuncs.com/xxx.png?Expires=xxx"
      }
    ]
  }
}
```

## 任务状态说明

| 状态 | 说明 |
|------|------|
| `PENDING` | 任务排队中 |
| `RUNNING` | 任务处理中 |
| `SUCCEEDED` | 任务成功，可以获取图片URL |
| `FAILED` | 任务失败，查看 error message |

## 性能指标

根据测试结果：

- **提交任务**：< 1秒
- **开始处理**：5-10秒后
- **完成时间**：15-30秒（取决于图片复杂度）
- **超时设置**：2分钟（60次轮询 × 2秒）

## 成本说明

- **模型**：wanx-v1
- **价格**：约 ¥0.08/张
- **100张图片**：约 ¥8

## 常见问题

### Q: 为什么不能使用同步调用？

A: 当前API Key的权限等级只支持异步调用。同步调用需要更高等级的API Key或付费升级。

### Q: 异步调用有什么缺点？

A:
- 需要轮询查询结果（增加代码复杂度）
- 完成时间不稳定（15-30秒）
- 需要处理超时情况

### Q: 如何切换到同步调用？

A:
1. 升级API Key权限等级
2. 或联系阿里云客服开通同步调用权限

### Q: 图片生成失败怎么办？

A:
1. 检查 API Key 是否正确
2. 检查阿里云控制台是否已开通 wanx-v1 服务
3. 查看服务器日志中的详细错误信息
4. 使用测试脚本验证API是否可用

## 更新日志

- **2024-01-12**: 更新为异步API模式，解决403 AccessDenied错误
- **2024-01-12**: 添加轮询查询逻辑
- **2024-01-12**: 创建测试脚本
