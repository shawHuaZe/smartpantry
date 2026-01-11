import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * @route   POST /api/scan/receipt
 * @desc    使用 Gemini AI 扫描并识别小票
 */
router.post('/receipt', authMiddleware, async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: '请提供小票图片' });
    }

    // 初始化 Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 构建提示词
    const prompt = `
请分析这张购物小票图片，提取所有物品信息。请以JSON格式返回，包含以下结构：
{
  "items": [
    {
      "name": "物品名称",
      "quantity": 数量,
      "category": "分类（食品/医药/日用品/其他）",
      "description": "描述信息（如品牌、规格等）"
    }
  ],
  "total": "总金额",
  "date": "购买日期",
  "store": "商店名称"
}

请确保：
1. 准确识别物品名称
2. 根据物品类型正确分类（药品归为医药，食物归为食品等）
3. 提取数量信息
4. 尽可能提取品牌和规格信息作为描述
`;

    // 调用 Gemini API
    let result;
    try {
      if (imageData.startsWith('data:image')) {
        // Base64 图片
        result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: imageData.split(',')[1],
              mimeType: 'image/jpeg'
            }
          }
        ]);
      } else {
        // 图片 URL
        result = await model.generateContent([
          prompt,
          imageData
        ]);
      }
    } catch (apiError) {
      console.error('Gemini API 错误:', apiError);
      return res.status(500).json({
        error: 'AI 识别失败',
        details: apiError.message
      });
    }

    const responseText = result.response.text();
    let parsedData;

    // 尝试解析 JSON
    try {
      // 移除可能的 markdown 代码块标记
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      // 如果解析失败，尝试提取 JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch {
          // 如果仍然失败，返回原始文本
          return res.json({
            success: true,
            raw: responseText,
            items: [],
            message: 'AI 识别完成，但无法解析为结构化数据'
          });
        }
      } else {
        return res.json({
          success: true,
          raw: responseText,
          items: [],
          message: 'AI 识别完成，但无法解析为结构化数据'
        });
      }
    }

    // 处理识别结果
    const items = parsedData.items || [];
    const processedItems = items.map(item => ({
      name: item.name || '未知物品',
      quantity: item.quantity || 1,
      category: item.category === '医药' ? '医药' :
                item.category === '食品' ? '食品' :
                item.category === '日用品' ? '日用品' : '其他',
      sub: item.description || '',
      icon: item.category === '医药' ? 'medical_services' :
             item.category === '食品' ? 'restaurant' :
             item.category === '日用品' ? 'shopping_basket' : 'category'
    }));

    res.json({
      success: true,
      items: processedItems,
      store: parsedData.store,
      total: parsedData.total,
      date: parsedData.date,
      raw: responseText
    });

  } catch (error) {
    console.error('小票扫描错误:', error);
    res.status(500).json({
      error: '扫描失败',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/scan/save-to-shopping-list
 * @desc    将扫描结果保存到购物清单
 */
router.post('/save-to-shopping-list', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '没有要保存的物品' });
    }

    // 批量插入购物清单
    const shoppingItems = items.map(item => ({
      user_id: req.user.id,
      name: item.name,
      sub: item.sub || '',
      count: item.quantity || 1,
      category: item.category || '其他',
      icon: item.icon || 'category',
      image: null
    }));

    const { data: insertedItems, error } = await supabase
      .from('shopping_list')
      .insert(shoppingItems)
      .select();

    if (error) {
      return res.status(500).json({ error: '保存到购物清单失败' });
    }

    res.status(201).json({
      message: `成功添加 ${items.length} 件物品到购物清单`,
      items: insertedItems
    });

  } catch (error) {
    console.error('保存到购物清单错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   POST /api/scan/save-to-inventory
 * @desc    将扫描结果直接保存到库存
 */
router.post('/save-to-inventory', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '没有要保存的物品' });
    }

    // 批量插入库存
    const inventoryItems = items.map(item => ({
      user_id: req.user.id,
      name: item.name,
      description: item.sub || '',
      quantity: item.quantity || 1,
      category: item.category === '食品' ? 'Food' :
                item.category === '医药' ? 'Medicine' :
                item.category === '日用品' ? 'Home' : 'Other',
      purchase_date: new Date().toISOString().split('T')[0]
    }));

    const { data: insertedItems, error } = await supabase
      .from('items')
      .insert(inventoryItems)
      .select();

    if (error) {
      return res.status(500).json({ error: '保存到库存失败' });
    }

    res.status(201).json({
      message: `成功添加 ${items.length} 件物品到库存`,
      items: insertedItems
    });

  } catch (error) {
    console.error('保存到库存错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
