const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

class ArticleService extends Service {
    /**
     * 获取所有文章数据
     */
    async getArticlesData() {
        try {
            const articlesPath = path.join(this.app.baseDir, 'mock/articles.json');
            const data = await fs.readFile(articlesPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('Failed to read articles data:', error);
            return { articles: [], metadata: {} };
        }
    }

    /**
     * 获取文章列表
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.pageSize - 每页数量
     * @param {string} options.category - 分类筛选
     * @param {string} options.tag - 标签筛选
     * @param {string} options.search - 搜索关键词
     * @param {string} options.status - 文章状态
     */
    async getArticleList(options = {}) {
        const {
            page = 1,
            pageSize = 10,
            category,
            tag,
            search,
            status = 'published'
        } = options;

        const { articles } = await this.getArticlesData();

        // 过滤条件
        let filteredArticles = articles.filter(article => {
            // 状态过滤
            if (status && article.status !== status) return false;

            // 分类过滤
            if (category) {
                // 支持 categorySlugs 数组
                if (!(article.categorySlugs && article.categorySlugs.includes(category))) return false;
            }

            // 标签过滤
            if (tag && !article.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))) return false;

            // 搜索过滤（仅搜索文章标题）
            if (search) {
                const searchLower = search.toLowerCase();
                return article.title.toLowerCase().includes(searchLower);
            }

            return true;
        });

        // 分页
        const total = filteredArticles.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        return {
            articles: paginatedArticles,
            pagination: {
                current: page,
                pageSize,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * 根据ID获取单篇文章
     * @param {number} id - 文章ID
     */
    async getArticleById(id) {
        const { articles } = await this.getArticlesData();
        return articles.find(article => article.id == id);
    }

    /**
     * 根据slug获取单篇文章
     * @param {string} slug - 文章slug
     */
    async getArticleBySlug(slug) {
        const { articles } = await this.getArticlesData();
        return articles.find(article => article.slug === slug);
    }

    /**
     * 获取文章内容（Markdown）
     * @param {string} contentPath - 文章内容路径
     * @param {Object} options - 选项
     * @param {boolean} options.includeContent - 是否包含完整内容，默认true
     * @param {boolean} options.checkBase64 - 是否检查base64图片，默认false
     * @param {number} options.maxSize - 最大内容大小(KB)，默认500KB
     */
    async getArticleContent(contentPath, options = {}) {
        const {
            includeContent = true,
            checkBase64 = false,
            maxSize = 500 // KB
        } = options;

        try {
            const fullPath = path.join(this.app.baseDir, contentPath);

            // 如果不需要内容，直接返回空字符串
            if (!includeContent) {
                return '';
            }

            // 检查文件大小
            const stats = await fs.stat(fullPath);
            const fileSizeKB = stats.size / 1024;

            if (fileSizeKB > maxSize) {
                this.logger.warn(`文章内容过大: ${contentPath} (${fileSizeKB.toFixed(2)}KB > ${maxSize}KB)`);
                return '内容过大，请使用专门的内容接口获取';
            }

            let content = await fs.readFile(fullPath, 'utf-8');

            // 检查是否包含base64图片
            if (checkBase64 && content.includes('data:image/')) {
                const base64Count = (content.match(/data:image\/[^;]+;base64,/g) || []).length;
                if (base64Count > 0) {
                    this.logger.warn(`文章包含 ${base64Count} 个base64图片: ${contentPath}`);
                    return '文章包含base64图片，请先运行图片提取脚本或使用原始内容接口';
                }
            }
            // 自动移除Markdown内容中的一级标题
            const lines = content.split('\n');
            if (lines.length > 0 && lines[0].startsWith('# ')) {
                lines.shift(); // 移除标题行
                // 如果标题行下面是空行，也一并移除
                if (lines.length > 0 && lines[0].trim() === '') {
                    lines.shift();
                }
                content = lines.join('\n');
            }


            return content;
        } catch (error) {
            this.logger.error('Failed to read article content:', error);
            return '';
        }
    }

    /**
     * 获取文章原始内容（不做任何检查和限制）
     * @param {string} contentPath - 文章内容路径
     */
    async getArticleRawContent(contentPath) {
        try {
            const fullPath = path.join(this.app.baseDir, contentPath);
            return await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
            this.logger.error('Failed to read article raw content:', error);
            return '';
        }
    }

    /**
     * 检查文章内容的性能信息
     * @param {string} contentPath - 文章内容路径
     */
    async getArticleContentInfo(contentPath) {
        try {
            const fullPath = path.join(this.app.baseDir, contentPath);
            const stats = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath, 'utf-8');

            const info = {
                filePath: contentPath,
                fileSize: stats.size,
                fileSizeKB: (stats.size / 1024).toFixed(2),
                contentLength: content.length,
                hasBase64Images: content.includes('data:image/'),
                base64ImageCount: (content.match(/data:image\/[^;]+;base64,/g) || []).length,
                estimatedBase64Size: 0
            };

            // 估算base64图片大小
            if (info.hasBase64Images) {
                const base64Matches = content.match(/data:image\/[^;]+;base64,([^)]+)/g) || [];
                info.estimatedBase64Size = base64Matches.reduce((total, match) => {
                    const base64Data = match.split(',')[1];
                    return total + (base64Data ? base64Data.length * 0.75 : 0); // base64大约比原文件大33%
                }, 0);
            }

            return info;
        } catch (error) {
            this.logger.error('Failed to get article content info:', error);
            return null;
        }
    }

    /**
     * 按分类获取文章
     * @param {string} categorySlug - 分类slug
     * @param {Object} options - 查询选项
     */
    async getArticlesByCategory(categorySlug, options = {}) {
        return this.getArticleList({ ...options, category: categorySlug });
    }

    /**
     * 按标签获取文章
     * @param {string} tagSlug - 标签slug
     * @param {Object} options - 查询选项
     */
    async getArticlesByTag(tagSlug, options = {}) {
        return this.getArticleList({ ...options, tag: tagSlug });
    }

    /**
     * 搜索文章
     * @param {string} keyword - 搜索关键词
     * @param {Object} options - 查询选项
     */
    async searchArticles(keyword, options = {}) {
        return this.getArticleList({ ...options, search: keyword });
    }

    /**
     * 获取热门文章
     * @param {number} limit - 数量限制
     */
    async getPopularArticles(limit = 5) {
        const { articles } = await this.getArticlesData();
        return articles
            .filter(article => article.status === 'published')
            .sort((a, b) => b.views - a.views)
            .slice(0, limit);
    }

    /**
     * 获取推荐文章
     * @param {number} limit - 数量限制
     */
    async getFeaturedArticles(limit = 5) {
        const { articles } = await this.getArticlesData();
        return articles
            .filter(article => article.status === 'published' && article.featured)
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }

    /**
     * 获取最新文章
     * @param {number} limit - 数量限制
     */
    async getLatestArticles(limit = 5) {
        const { articles } = await this.getArticlesData();
        return articles
            .filter(article => article.status === 'published')
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, limit);
    }
}

module.exports = ArticleService; 