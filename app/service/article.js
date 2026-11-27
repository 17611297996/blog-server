const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

// 进程级内存缓存
let _cache = null;

// 供 admin service 调用，写入后清缓存保证实时生效
const clearCache = () => { _cache = null; };
module.exports._clearCache = clearCache;

class ArticleService extends Service {
    async getArticlesData() {
        if (_cache) return _cache;
        try {
            const articlesPath = path.join(this.app.baseDir, 'mock/articles.json');
            const data = await fs.readFile(articlesPath, 'utf-8');
            _cache = JSON.parse(data);
            return _cache;
        } catch (error) {
            this.logger.error('Failed to read articles data:', error);
            return { articles: [] };
        }
    }

    // 供管理操作手动清除缓存
    clearCache() {
        _cache = null;
    }

    async getArticleList(options = {}) {
        const { page = 1, pageSize = 10, category, tag, search, status = 'published' } = options;
        const { articles } = await this.getArticlesData();

        let filtered = articles.filter(a => {
            if (status && a.status !== status) return false;
            if (category && !(a.categorySlugs && a.categorySlugs.includes(category))) return false;
            if (tag && !a.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))) return false;
            if (search) return a.title.toLowerCase().includes(search.toLowerCase());
            return true;
        });

        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize).map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            categoryId: a.categoryId,
            categorySlug: a.categorySlug,
            categorySlugs: a.categorySlugs,
            tags: a.tags,
            author: a.author,
            publishDate: a.publishDate,
            updateDate: a.updateDate,
            status: a.status,
            views: a.views,
            likes: a.likes,
            featured: a.featured,
            coverImage: a.coverImage,
        }));

        return {
            articles: items,
            pagination: { current: page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        };
    }

    async getArticleById(id) {
        const { articles } = await this.getArticlesData();
        return articles.find(a => a.id == id) || null;
    }

    async getArticleBySlug(slug) {
        const { articles } = await this.getArticlesData();
        return articles.find(a => a.slug === slug) || null;
    }

    async searchArticles(keyword, options = {}) {
        return this.getArticleList({ ...options, search: keyword });
    }

    async getStats() {
        const { articles } = await this.getArticlesData();
        const published = articles.filter(a => a.status === 'published');
        const categories = new Set(published.map(a => a.categorySlug).filter(Boolean));
        const tags = new Set(published.flatMap(a => a.tags));
        return {
            totalArticles: published.length,
            totalCategories: categories.size,
            totalTags: tags.size,
        };
    }
}

module.exports = ArticleService;
