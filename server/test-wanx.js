/**
 * 测试阿里云通义万相API
 * 用于调试图片生成功能
 */

import dotenv from 'dotenv';
import fs from 'fs';

// 加载环境变量
dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

if (!API_KEY) {
    console.error('❌ 错误: 请在 server/.env 中配置 DASHSCOPE_API_KEY');
    process.exit(1);
}

console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
console.log('');

// 测试不同的API端点和格式
const TEST_CASES = [
    {
        name: '测试1: 异步调用 - 官方API (X-DashScope-Async: enable)',
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
        headers: {
            'X-DashScope-Async': 'enable'  // 关键：启用异步模式
        },
        body: {
            model: 'wanx-v1',
            input: {
                prompt: 'A red apple on white background, product photography, high quality, professional'
            },
            parameters: {
                size: '1024*1024',
                n: 1,
                seed: Math.floor(Math.random() * 1000000)
            }
        }
    },
    {
        name: '测试2: 使用 wanx-v1 模型',
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
        headers: {
            'X-DashScope-Async': 'enable'
        },
        body: {
            model: 'wanx-v1',
            input: {
                prompt: 'Professional product photography of an apple, white background, studio lighting, 4k'
            },
            parameters: {
                size: '1024*1024',
                n: 1
            }
        }
    }
];

async function testAPI(testCase) {
    console.log(`📝 ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log('');

    try {
        const headers = {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            ...testCase.headers
        };

        const response = await fetch(testCase.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(testCase.body)
        });

        const responseText = await response.text();

        console.log(`📊 状态码: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.log(`❌ 错误响应:`);
            console.log(`   ${responseText}`);

            // 尝试解析JSON错误
            try {
                const errorData = JSON.parse(responseText);
                console.log(`   错误码: ${errorData.code}`);
                console.log(`   错误信息: ${errorData.message}`);

                if (errorData.message.includes('async')) {
                    console.log('');
                    console.log('💡 提示: API Key不支持同步调用，需要使用异步模式');
                    console.log('   解决方案:');
                    console.log('   1. 先提交异步任务，获取 task_id');
                    console.log('   2. 使用 task_id 轮询查询结果');
                    console.log('   3. 或者升级API Key到支持同步调用的版本');
                }
            } catch (e) {
                // 不是JSON格式
            }
        } else {
            console.log(`✅ 成功!`);

            try {
                const data = JSON.parse(responseText);
                console.log(`   响应数据:`, JSON.stringify(data, null, 2));

                // 检查是否有task_id（异步模式）
                if (data.output && data.output.task_id) {
                    console.log('');
                    console.log(`🔄 异步任务已提交`);
                    console.log(`   Task ID: ${data.output.task_id}`);
                    console.log(`   请使用此ID查询任务结果`);
                }

                // 检查是否有图片URL（同步模式）
                if (data.output && data.output.results && data.output.results[0]) {
                    console.log('');
                    console.log(`🖼️  图片已生成!`);
                    console.log(`   URL: ${data.output.results[0].url}`);
                }
            } catch (e) {
                console.log(`   原始响应: ${responseText}`);
            }
        }
    } catch (error) {
        console.log(`❌ 请求失败:`, error.message);
    }

    console.log('');
    console.log('─'.repeat(80));
    console.log('');
}

// 查询异步任务结果
async function checkAsyncResult(taskId) {
    console.log(`🔍 查询异步任务结果: ${taskId}`);

    const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        console.log(`📊 状态码: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log(`   任务状态: ${data.output?.task_status || 'UNKNOWN'}`);

            if (data.output?.task_status === 'SUCCEEDED' && data.output?.results) {
                console.log(`✅ 任务完成!`);
                console.log(`   图片URL: ${data.output.results[0].url}`);
            } else if (data.output?.task_status === 'PENDING' || data.output?.task_status === 'PROCESSING') {
                console.log(`⏳ 任务处理中...请稍后查询`);
            } else if (data.output?.task_status === 'FAILED') {
                console.log(`❌ 任务失败`);
                console.log(`   错误: ${data.output?.message || 'Unknown error'}`);
            }
        } else {
            console.log(`❌ 查询失败: ${responseText}`);
        }
    } catch (error) {
        console.log(`❌ 请求失败:`, error.message);
    }
}

async function main() {
    console.log('='.repeat(80));
    console.log('阿里云通义万相 API 测试');
    console.log('='.repeat(80));
    console.log('');

    // 运行测试用例
    for (const testCase of TEST_CASES) {
        await testAPI(testCase);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('测试完成');
    console.log('='.repeat(80));
}

// 如果提供了task_id参数，则查询任务结果
const args = process.argv.slice(2);
if (args[0] === 'check' && args[1]) {
    checkAsyncResult(args[1]);
} else {
    main();
}
