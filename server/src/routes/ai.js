import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { recognizeReceipt, understandText, generateProductImage } from '../utils/aiService.js';
import { submitImageGenerationTask, getTaskStatus, cancelTask } from '../utils/imageGenerationQueue.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   POST /api/ai/recognize-receipt
 * @desc    使用AI识别购物小票/图片
 * @body    { image: base64 string }
 */
router.post('/recognize-receipt', authMiddleware, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: '请提供图片数据' });
    }

    // 调用AI服务识别
    const items = await recognizeReceipt(image);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('AI识别错误:', error);
    res.status(500).json({
      error: error.message || 'AI识别失败，请重试'
    });
  }
});

/**
 * @route   POST /api/ai/understand-text
 * @desc    使用AI理解文本输入
 * @body    { text: string }
 */
router.post('/understand-text', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '请提供输入文本' });
    }

    // 调用AI服务理解
    const items = await understandText(text);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('AI理解错误:', error);
    res.status(500).json({
      error: error.message || 'AI理解失败，请重试'
    });
  }
});

/**
 * @route   POST /api/ai/transcribe-audio
 * @desc    语音转文字（预留接口）
 */
router.post('/transcribe-audio', upload.single('audio'), authMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请提供音频文件' });
    }

    // TODO: 实现实际的语音识别
    // 这里需要集成阿里云Fun-ASR服务

    res.json({
      success: true,
      text: '语音识别功能开发中'
    });
  } catch (error) {
    console.error('语音识别错误:', error);
    res.status(500).json({
      error: error.message || '语音识别失败'
    });
  }
});

/**
 * @route   POST /api/ai/generate-image
 * @desc    使用AI生成物品图片（同步，会阻塞）
 * @body    { name: string, category: string }
 */
router.post('/generate-image', authMiddleware, async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: '请提供物品名称' });
    }

    // 调用AI服务生成图片
    const imageUrl = await generateProductImage(name, category);

    res.json({
      success: true,
      imageUrl
    });
  } catch (error) {
    console.error('图片生成错误:', error);
    res.status(500).json({
      error: error.message || '图片生成失败，请重试'
    });
  }
});

/**
 * @route   POST /api/ai/generate-image-async
 * @desc    使用AI生成物品图片（异步，不阻塞，立即返回）
 * @body    { itemId: string, name: string, category: string }
 */
router.post('/generate-image-async', authMiddleware, async (req, res) => {
  try {
    const { itemId, name, category } = req.body;

    if (!itemId || !name) {
      return res.status(400).json({ error: '请提供物品ID和名称' });
    }

    // 提交异步任务，立即返回
    const result = await submitImageGenerationTask(itemId, name, category, req.user.id);

    if (!result.success) {
      return res.status(500).json({
        error: result.error || '图片生成任务提交失败'
      });
    }

    res.json({
      success: true,
      taskId: result.taskId,
      message: '图片生成任务已提交，将在后台处理'
    });
  } catch (error) {
    console.error('图片生成任务提交错误:', error);
    res.status(500).json({
      error: error.message || '图片生成任务提交失败'
    });
  }
});

/**
 * @route   GET /api/ai/image-task/:itemId
 * @desc    查询图片生成任务状态
 */
router.get('/image-task/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    const task = getTaskStatus(itemId);

    if (!task) {
      return res.status(404).json({
        error: '任务不存在'
      });
    }

    res.json({
      success: true,
      task: {
        status: task.status,
        imageUrl: task.imageUrl,
        completedAt: task.completedAt,
        error: task.error
      }
    });
  } catch (error) {
    console.error('查询任务状态错误:', error);
    res.status(500).json({
      error: error.message || '查询任务状态失败'
    });
  }
});

/**
 * @route   DELETE /api/ai/image-task/:itemId
 * @desc    取消图片生成任务
 */
router.delete('/image-task/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cancelled = cancelTask(itemId);

    if (!cancelled) {
      return res.status(404).json({
        error: '任务不存在'
      });
    }

    res.json({
      success: true,
      message: '任务已取消'
    });
  } catch (error) {
    console.error('取消任务错误:', error);
    res.status(500).json({
      error: error.message || '取消任务失败'
    });
  }
});

export default router;
