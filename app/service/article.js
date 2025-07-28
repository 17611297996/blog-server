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