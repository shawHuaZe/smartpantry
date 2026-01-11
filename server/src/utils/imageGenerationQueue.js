/**
 * 图片生成任务队列管理
 * 支持后台异步生成图片，不阻塞用户操作
 */

import { supabase } from '../config/supabase.js';

// 内存中的任务队列（生产环境应该使用数据库或Redis）
const taskQueue = new Map(); // itemId -> { status, taskId, productName, category, timestamp, userId }

/**
 * 提交图片生成任务到队列
 * 立即返回，不等待生成完成
 */
export async function submitImageGenerationTask(itemId, productName, category = 'Other', userId) {
    const categoryMap = {
        'Food': '食物',
        'Medicine': '药品',
        'Home': '日用品',
        'Other': '商品'
    };
    const categoryName = categoryMap[category] || '商品';

    const API_KEY = process.env.DASHSCOPE_API_KEY;

    try {
        const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'X-DashScope-Async': 'enable'
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

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Task submission failed:', response.status, errorText);
            return { success: false, error: '提交失败' };
        }

        const data = await response.json();

        if (data.output && data.output.task_id) {
            // 添加到任务队列
            taskQueue.set(itemId, {
                status: 'PENDING',
                taskId: data.output.task_id,
                productName,
                category,
                timestamp: Date.now(),
                userId
            });

            console.log(`✅ 图片生成任务已提交: ${itemId} -> ${data.output.task_id}`);

            // 启动后台处理（不阻塞）
            processTaskInBackground(itemId);

            return { success: true, taskId: data.output.task_id };
        }

        return { success: false, error: '未能获取任务ID' };
    } catch (error) {
        console.error('Submit task error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 后台处理任务（不阻塞）
 */
async function processTaskInBackground(itemId) {
    const task = taskQueue.get(itemId);
    if (!task) return;

    const maxAttempts = 60;
    const pollInterval = 3000; // 每3秒查询一次

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const result = await checkTaskStatus(task.taskId);

        if (result.success) {
            task.status = 'COMPLETED';
            task.imageUrl = result.imageUrl;
            task.completedAt = Date.now();

            console.log(`✅ 图片生成完成: ${itemId} -> ${result.imageUrl}`);

            // 更新数据库中的物品图片
            try {
                const { error } = await supabase
                    .from('items')
                    .update({ image: result.imageUrl })
                    .eq('id', itemId)
                    .eq('user_id', task.userId);

                if (error) {
                    console.error(`❌ 更新数据库失败: ${itemId}`, error);
                } else {
                    console.log(`✅ 物品图片已更新到数据库: ${itemId}`);
                }
            } catch (dbError) {
                console.error(`❌ 更新数据库异常: ${itemId}`, dbError);
            }

            break;
        }

        if (result.status === 'FAILED') {
            task.status = 'FAILED';
            task.error = result.error;
            console.error(`❌ 图片生成失败: ${itemId} -> ${result.error}`);
            break;
        }

        // PENDING 或 RUNNING，继续轮询
        console.log(`⏳ 任务进行中: ${itemId} (${attempt + 1}/${maxAttempts})`);
    }

    if (task.status === 'PENDING' || task.status === 'PROCESSING') {
        task.status = 'TIMEOUT';
        console.error(`⏰ 图片生成超时: ${itemId}`);
    }
}

/**
 * 查询任务状态
 */
async function checkTaskStatus(taskId) {
    const API_KEY = process.env.DASHSCOPE_API_KEY;

    try {
        // 使用正确的任务查询端点
        const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return { success: false, status: 'ERROR', error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const taskStatus = data.output?.task_status;

        if (taskStatus === 'SUCCEEDED') {
            if (data.output?.results && data.output.results[0]?.url) {
                return { success: true, status: 'SUCCEEDED', imageUrl: data.output.results[0].url };
            }
            return { success: false, status: 'SUCCEEDED', error: '未找到图片URL' };
        }

        if (taskStatus === 'FAILED') {
            return { success: false, status: 'FAILED', error: data.output?.message || '未知错误' };
        }

        // PENDING 或 RUNNING
        return { success: false, status: taskStatus };
    } catch (error) {
        console.error('Check task status error:', error);
        return { success: false, status: 'ERROR', error: error.message };
    }
}

/**
 * 获取任务状态（供前端查询）
 */
export function getTaskStatus(itemId) {
    return taskQueue.get(itemId);
}

/**
 * 取消任务
 */
export function cancelTask(itemId) {
    return taskQueue.delete(itemId);
}

/**
 * 清理过期任务（超过1小时）
 */
export function cleanupExpiredTasks() {
    const oneHourAgo = Date.now() - 3600000;

    for (const [itemId, task] of taskQueue.entries()) {
        if (task.timestamp < oneHourAgo) {
            taskQueue.delete(itemId);
            console.log(`🧹 清理过期任务: ${itemId}`);
        }
    }
}

// 每小时清理一次过期任务
setInterval(cleanupExpiredTasks, 3600000);
