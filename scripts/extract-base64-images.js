const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 从 markdown 内容中提取 base64 图片并保存为文件
 * @param {string} content - markdown 内容
 * @param {string} articleSlug - 文章 slug
 * @returns {Promise<string>} 处理后的 markdown 内容
 */
async function extractBase64Images(content, articleSlug) {
    const imagesDir = path.join(__dirname, '../content/assets/images');

    // 确保图片目录存在
    await fs.mkdir(imagesDir, { recursive: true });

    // 匹配 base64 图片的正则表达式
    const base64ImageRegex = /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([^)]+)\)/g;

    let processedContent = content;
    let match;
    let imageCounter = 1;

    while ((match = base64ImageRegex.exec(content)) !== null) {
        const [fullMatch, altText, imageType, base64Data] = match;

        try {
            // 生成文件名
            const hash = crypto.createHash('md5').update(base64Data).digest('hex').substring(0, 8);
            const fileName = `${articleSlug}-${imageCounter}-${hash}.${imageType}`;
            const filePath = path.join(imagesDir, fileName);

            // 保存图片文件
            const imageBuffer = Buffer.from(base64Data, 'base64');
            await fs.writeFile(filePath, imageBuffer);

            // 替换 markdown 中的引用
            const imageUrl = `/content/assets/images/${fileName}`;
            const replacement = `![${altText}](${imageUrl})`;

            processedContent = processedContent.replace(fullMatch, replacement);

            console.log(`✅ 提取图片: ${fileName} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
            imageCounter++;

        } catch (error) {
            console.error(`❌ 处理图片失败:`, error.message);
        }
    }

    return processedContent;
}

/**
 * 处理单个文章文件
 * @param {string} filePath - 文章文件路径
 */
async function processArticleFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');

        // 检查是否包含 base64 图片
        if (!content.includes('data:image/')) {
            console.log(`⏭️  跳过: ${path.basename(filePath)} (无 base64 图片)`);
            return;
        }

        console.log(`🔄 处理: ${path.basename(filePath)}`);

        // 生成文章 slug
        const articleSlug = path.basename(filePath, '.md');

        // 提取 base64 图片
        const processedContent = await extractBase64Images(content, articleSlug);

        // 如果内容有变化，保存文件
        if (processedContent !== content) {
            // 备份原文件
            const backupPath = filePath + '.backup';
            await fs.writeFile(backupPath, content);

            // 保存处理后的文件
            await fs.writeFile(filePath, processedContent);

            console.log(`✅ 完成: ${path.basename(filePath)}`);
        }

    } catch (error) {
        console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    }
}

/**
 * 递归处理目录中的所有 markdown 文件
 * @param {string} dir - 目录路径
 */
async function processDirectory(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.isFile() && path.extname(entry.name) === '.md') {
                await processArticleFile(fullPath);
            }
        }
    } catch (error) {
        console.error(`❌ 处理目录失败 ${dir}:`, error.message);
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始提取 base64 图片...\n');

    const articlesDir = path.join(__dirname, '../content/articles');

    try {
        await fs.access(articlesDir);
        await processDirectory(articlesDir);

        console.log('\n✅ base64 图片提取完成!');
        console.log('💡 原文件已备份为 .backup 后缀');
        console.log('💡 请运行 npm run build:articles 重新生成索引');

    } catch (error) {
        console.error('❌ 脚本执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    extractBase64Images,
    processArticleFile,
    processDirectory
}; 