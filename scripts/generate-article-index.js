#!/usr/bin/env node

/**
 * 文章索引生成器
 * 
 * 功能：
 * 1. 扫描 content/articles 目录下的所有 markdown 文件
 * 2. 解析文章元数据（标题、日期、标签等）
 * 3. 生成或更新 mock/articles.json 文件
 * 
 * 使用方法：
 * node scripts/generate-article-index.js
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 配置
const CONFIG = {
    articlesDir: path.join(__dirname, '../content/articles'),
    outputFile: path.join(__dirname, '../mock/articles.json'),
    categoriesFile: path.join(__dirname, '../mock/categories.json')
};

// 分类映射
const CATEGORY_MAP = {
    'frontend': { id: 1, name: '前端开发' },
    'backend': { id: 2, name: '后端开发' },
    'server': { id: 3, name: '服务器' },
    'performance': { id: 4, name: '性能监控' },
    'wechat': { id: 5, name: '微信相关' }
};

/**
 * 解析 Markdown 文件的元数据
 */
function parseMarkdownMeta(content, filePath) {
    const lines = content.split('\n');
    const meta = {
        title: '',
        publishDate: '',
        category: '',
        tags: [],
        excerpt: ''
    };

    // 提取标题（第一个 # 标题）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        meta.title = titleMatch[1].trim();
    }

    // 提取元数据块（只处理文件开头的 > 开头的行，遇到空行或其他内容就停止）
    const metaLines = [];
    let foundTitle = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 跳过标题行
        if (line.startsWith('#') && !foundTitle) {
            foundTitle = true;
            continue;
        }

        // 跳过空行
        if (line.trim() === '') {
            continue;
        }

        // 如果是 > 开头的行，添加到元数据
        if (line.startsWith('>')) {
            metaLines.push(line);
        } else if (foundTitle && metaLines.length > 0) {
            // 如果已经找到了标题和一些元数据，遇到非 > 开头的行就停止
            break;
        }
    }

    metaLines.forEach(line => {
        const text = line.replace(/^>\s*/, '');

        if (text.includes('发布时间')) {
            const dateMatch = text.match(/发布时间：(.+)/);
            if (dateMatch) {
                meta.publishDate = new Date(dateMatch[1].trim()).toISOString();
            }
        }

        if (text.includes('分类')) {
            const categoryMatch = text.match(/分类：(.+)/);
            if (categoryMatch) {
                meta.category = categoryMatch[1].trim();
            }
        }

        if (text.includes('标签')) {
            const tagsMatch = text.match(/标签：(.+)/);
            if (tagsMatch) {
                meta.tags = tagsMatch[1].split(',').map(tag => tag.trim());
            }
        }
    });

    // 生成摘要（取第一段文字内容）
    const contentWithoutMeta = content
        .replace(/^#.+$/gm, '')  // 移除标题
        .replace(/^>.+$/gm, '')  // 移除元数据
        .replace(/```[\s\S]*?```/g, '')  // 移除代码块
        .trim();

    const firstParagraph = contentWithoutMeta.split('\n\n')[0];
    if (firstParagraph) {
        meta.excerpt = firstParagraph.substring(0, 150) + '...';
    }

    return meta;
}

/**
 * 生成文章的 slug
 */
function generateSlug(title, filePath) {
    // 优先使用文件名作为 slug
    const filename = path.basename(filePath, '.md');
    return filename.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * 根据文件路径确定分类
 */
function getCategoryFromPath(filePath) {
    const relativePath = path.relative(CONFIG.articlesDir, filePath);
    const pathParts = relativePath.split(path.sep);

    if (pathParts.length > 1) {
        const categoryDir = pathParts[0];
        return CATEGORY_MAP[categoryDir] || null;
    }

    return null;
}

/**
 * 递归扫描目录，查找所有 markdown 文件
 */
async function scanMarkdownFiles(dir) {
    const files = [];

    async function scan(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                await scan(fullPath);
            } else if (entry.isFile() && path.extname(entry.name) === '.md') {
                files.push(fullPath);
            }
        }
    }

    await scan(dir);
    return files;
}

// 递归查找分类名路径对应的slug路径
function findCategorySlugsByNames(categories, namePathArr) {
    let result = [];
    let currentList = categories;
    for (const name of namePathArr) {
        const found = currentList.find(cat => cat.name === name.trim());
        if (!found) break;
        result.push(found.slug);
        currentList = found.subCategories || [];
    }
    return result;
}

// 生成categorySlugs，优先用元数据分类字段
async function getCategorySlugsFromMetaOrPath(meta, filePath) {
    const categoriesData = JSON.parse(await fs.readFile(CONFIG.categoriesFile, 'utf-8'));
    if (meta.category) {
        // 支持“前端开发 > Vue”格式
        const namePathArr = meta.category.split('>').map(s => s.trim());
        const slugs = findCategorySlugsByNames(categoriesData.categories, namePathArr);
        if (slugs.length > 0) return slugs;
    }
    // fallback: 目录结构推断
    const relativePath = path.relative(CONFIG.articlesDir, filePath);
    const pathParts = relativePath.split(path.sep);
    if (pathParts.length < 2) return [];
    const topSlug = pathParts[0];
    const subSlug = pathParts[1] && pathParts[1].endsWith('.md') ? null : pathParts[1];
    const slugs = [];
    const topCategory = categoriesData.categories.find(cat => cat.slug === topSlug);
    if (topCategory) {
        slugs.push(topCategory.slug);
        if (subSlug && topCategory.subCategories) {
            const subCategory = topCategory.subCategories.find(sub => sub.slug === subSlug);
            if (subCategory) {
                slugs.push(subCategory.slug);
            }
        }
    }
    return slugs;
}

/**
 * 处理单个文章文件
 */
async function processArticle(filePath, existingArticles = {}) {
    console.log(`处理文章: ${filePath}`);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const meta = parseMarkdownMeta(content, filePath);
        const category = getCategoryFromPath(filePath);
        const categorySlugs = await getCategorySlugsFromMetaOrPath(meta, filePath);

        if (!meta.title) {
            console.warn(`警告: ${filePath} 没有找到标题`);
            return null;
        }

        // 生成文章 ID（基于文件路径的哈希）
        const relativePath = path.relative(CONFIG.articlesDir, filePath);
        const id = parseInt(crypto.createHash('md5').update(relativePath).digest('hex').substring(0, 8), 16);

        const article = {
            id,
            title: meta.title,
            slug: generateSlug(meta.title, filePath),
            excerpt: meta.excerpt,
            // 修正 content 字段为相对项目根目录的路径
            content: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
            categoryId: category ? category.id : 0,
            categorySlug: category ? Object.keys(CATEGORY_MAP).find(key => CATEGORY_MAP[key].id === category.id) : '',
            categorySlugs, // 新增字段
            tags: meta.tags,
            author: "admin",
            publishDate: meta.publishDate || new Date().toISOString(),
            updateDate: new Date().toISOString(),
            status: "published",
            views: existingArticles[id]?.views || 0,
            likes: existingArticles[id]?.likes || 0,
            comments: existingArticles[id]?.comments || 0,
            featured: existingArticles[id]?.featured || false,
            coverImage: `content/assets/images/${path.basename(filePath, '.md')}-cover.jpg`
        };

        return article;
    } catch (error) {
        console.error(`错误: 处理文章 ${filePath} 时出错:`, error.message);
        return null;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始生成文章索引...');

    try {
        // 检查文章目录是否存在
        await fs.access(CONFIG.articlesDir);

        // 读取现有的文章数据（如果存在）
        let existingData = { articles: [] };
        try {
            const existingContent = await fs.readFile(CONFIG.outputFile, 'utf-8');
            existingData = JSON.parse(existingContent);
        } catch (error) {
            console.log('📝 没有找到现有的文章索引文件，将创建新文件');
        }

        // 将现有文章转换为以 ID 为键的对象，便于查找
        const existingArticles = {};
        if (existingData.articles) {
            existingData.articles.forEach(article => {
                existingArticles[article.id] = article;
            });
        }

        // 扫描所有 markdown 文件
        console.log('📂 扫描文章目录...');
        const markdownFiles = await scanMarkdownFiles(CONFIG.articlesDir);
        console.log(`找到 ${markdownFiles.length} 个 markdown 文件`);

        // 处理每个文章文件
        const articles = [];
        for (const filePath of markdownFiles) {
            const article = await processArticle(filePath, existingArticles);
            if (article) {
                articles.push(article);
            }
        }

        // 按发布日期排序
        articles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

        // 生成统计信息
        const publishedArticles = articles.filter(a => a.status === 'published');
        const draftArticles = articles.filter(a => a.status === 'draft');

        // 构造输出数据
        const outputData = {
            articles,
            metadata: {
                totalArticles: articles.length,
                publishedArticles: publishedArticles.length,
                draftArticles: draftArticles.length,
                lastUpdated: new Date().toISOString(),
                version: "1.0.0",
                generatedBy: "generate-article-index.js"
            }
        };

        // 写入文件
        await fs.writeFile(CONFIG.outputFile, JSON.stringify(outputData, null, 2), 'utf-8');

        console.log('✅ 文章索引生成完成!');
        console.log(`📊 统计信息:`);
        console.log(`   - 总文章数: ${articles.length}`);
        console.log(`   - 已发布: ${publishedArticles.length}`);
        console.log(`   - 草稿: ${draftArticles.length}`);
        console.log(`📁 输出文件: ${CONFIG.outputFile}`);

    } catch (error) {
        console.error('❌ 生成文章索引时出错:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    main,
    processArticle,
    scanMarkdownFiles,
    parseMarkdownMeta
};