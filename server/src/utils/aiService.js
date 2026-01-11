/**
 * AI Service for Qwen models
 * Handles OCR, vision understanding, and text processing
 */

// 配置
const AI_CONFIG = {
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.DASHSCOPE_API_KEY || ''
};

/**
 * 调用通义千问VL模型进行图片理解（包含OCR）
 * 一次性完成图片文字识别和结构化提取
 */
export async function recognizeReceipt(imageBase64) {
    try {
        const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-vl-plus',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageBase64
                                }
                            },
                            {
                                type: 'text',
                                text: `请识别这张购物小票或照片中的所有物品信息。

要求：
1. 提取所有物品的名称、价格、数量
2. 根据物品名称判断分类（Food食物、Medicine药品、Home日用品、Other其他）
3. 如果是购物小票，请忽略"总计"、"找零"等非商品项
4. 价格和数量如果识别不出来，使用合理默认值

请严格按照以下JSON格式返回，不要包含其他内容：
[
  {
    "name": "商品名称",
    "price": 价格数字,
    "quantity": "数量字符串，如：1个、1盒、1袋",
    "category": "分类（Food/Medicine/Home/Other）"
  }
]

只返回JSON数组，不要有其他文字说明。`
                            }
                        ]
                    }
                ],
                temperature: 0.1, // 降低随机性，提高准确性
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Qwen VL API Error:', errorData);
            throw new Error(errorData.error?.message || 'AI识别失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 解析返回的JSON
        try {
            // 清理可能的markdown标记
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const items = JSON.parse(cleanContent);

            // 验证返回的数据格式
            if (!Array.isArray(items)) {
                throw new Error('返回格式错误：应该是数组');
            }

            // 确保每个物品都有必需的字段
            return items.map(item => ({
                name: item.name || '未知商品',
                price: parseFloat(item.price) || 0,
                quantity: item.quantity || '1个',
                category: item.category || 'Other'
            }));
        } catch (parseError) {
            console.error('JSON Parse Error:', content, parseError);
            throw new Error('AI返回格式解析失败');
        }
    } catch (error) {
        console.error('Receipt recognition error:', error);
        throw error;
    }
}

/**
 * 使用通义千问Plus理解用户输入的文本
 */
export async function understandText(text) {
    try {
        const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                messages: [
                    {
                        role: 'user',
                        content: `请从以下文本中提取购物物品信息：

"${text}"

要求：
1. 识别所有提到的物品
2. 根据描述估算价格（如果没有明确提到）
3. 判断每个物品的分类（Food食物、Medicine药品、Home日用品、Other其他）
4. 估算合理的数量

请严格按照以下JSON格式返回：
[
  {
    "name": "商品名称",
    "price": 价格数字,
    "quantity": "数量字符串",
    "category": "分类（Food/Medicine/Home/Other）"
  }
]

只返回JSON数组，不要有其他文字说明。`
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Qwen Plus API Error:', errorData);
            throw new Error(errorData.error?.message || 'AI理解失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 解析返回的JSON
        try {
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const items = JSON.parse(cleanContent);

            if (!Array.isArray(items)) {
                throw new Error('返回格式错误：应该是数组');
            }

            return items.map(item => ({
                name: item.name || '未知商品',
                price: parseFloat(item.price) || 0,
                quantity: item.quantity || '1个',
                category: item.category || 'Other'
            }));
        } catch (parseError) {
            console.error('JSON Parse Error:', content, parseError);
            throw new Error('AI返回格式解析失败');
        }
    } catch (error) {
        console.error('Text understanding error:', error);
        throw error;
    }
}

/**
 * 语音识别（使用阿里云Fun-ASR）
 * 注意：这里需要前端录音后上传音频文件
 */
export async function transcribeAudio(audioBuffer) {
    try {
        // 阿里云Fun-ASR需要使用专门的SDK或REST API
        // 这里提供一个简化的实现思路

        // 实际项目中应该使用阿里云的实时语音识别SDK
        // 或者将音频上传后调用REST API

        // 临时返回模拟文本（实际项目中需要替换）
        return "今天在超市买了苹果和牛奶";
    } catch (error) {
        console.error('Audio transcription error:', error);
        throw error;
    }
}

/**
 * 使用阿里云通义万相 wanx-v1 生成物品写实图片
 * 注意：此API需要使用异步模式
 */
export async function generateProductImage(productName, category = 'Other') {
    const categoryMap = {
        'Food': '食物',
        'Medicine': '药品',
        'Home': '日用品',
        'Other': '商品'
    };

    const categoryName = categoryMap[category] || '商品';

    try {
        // 1. 提交异步任务
        const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';

        const submitResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-Async': 'enable'  // 关键：启用异步模式
            },
            body: JSON.stringify({
                model: 'wanx-v1',
                input: {
                    prompt: `A professional product photography of ${productName}, ${categoryName}, clean white background, studio lighting, high quality, detailed, commercial product shot, 4k resolution, photorealistic`
                },
                parameters: {
                    size: '1024*1024',
                    n: 1,
                    seed: Math.floor(Math.random() * 1000000)
                }
            })
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            console.error('Task submission failed:', submitResponse.status, errorText);
            throw new Error(`图片生成任务提交失败: ${submitResponse.statusText}`);
        }

        const submitData = await submitResponse.json();

        if (!submitData.output || !submitData.output.task_id) {
            console.error('Invalid response:', submitData);
            throw new Error('未能获取任务ID');
        }

        const taskId = submitData.output.task_id;
        console.log(`图片生成任务已提交: ${taskId}`);

        // 2. 轮询查询任务结果
        const maxAttempts = 60; // 最多轮询60次
        const pollInterval = 2000; // 每2秒查询一次

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            // 使用正确的任务查询端点
            const taskCheckUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
            const statusResponse = await fetch(taskCheckUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!statusResponse.ok) {
                console.error(`Task status check failed (attempt ${attempt + 1}):`, statusResponse.status);
                continue;
            }

            const statusData = await statusResponse.json();
            const taskStatus = statusData.output?.task_status;

            console.log(`任务状态 (${attempt + 1}/${maxAttempts}): ${taskStatus}`);

            if (taskStatus === 'SUCCEEDED') {
                if (statusData.output?.results && statusData.output.results[0]?.url) {
                    const imageUrl = statusData.output.results[0].url;
                    console.log(`✅ 图片生成成功: ${imageUrl}`);
                    return imageUrl;
                }
            }

            if (taskStatus === 'FAILED') {
                const errorMessage = statusData.output?.message || '未知错误';
                throw new Error(`图片生成失败: ${errorMessage}`);
            }

            if (taskStatus === 'PENDING' || taskStatus === 'RUNNING') {
                continue; // 继续轮询
            }
        }

        throw new Error('图片生成超时，请稍后重试');
    } catch (error) {
        console.error('Image generation error:', error);
        throw error;
    }
}
