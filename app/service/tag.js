const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

class TagService extends Service {
    /**
     * 获取所有标签数据
     */
    async getTagsData() {
        try {
            const tagsPath = path.join(this.app.baseDir, 'mock/tags.json');
            const data = await fs.readFile(tagsPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('Failed to read tags data:', error);
            return { tags: [], metadata: {} };
        }
    }

    /**
     * 获取所有标签列表
     */
    async getAllTags() {
        const { tags } = await this.getTagsData();
        return tags;
    }

    /**
     * 根据ID获取标签
     * @param {number} id - 标签ID
     */
    async getTagById(id) {
        const { tags } = await this.getTagsData();
        return tags.find(tag => tag.id == id);
    }

    /**
     * 根据slug获取标签
     * @param {string} slug - 标签slug
     */
    async getTagBySlug(slug) {
        const { tags } = await this.getTagsData();
        return tags.find(tag => tag.slug === slug);
    }

    /**
     * 根据名称获取标签
     * @param {string} name - 标签名称
     */
    async getTagByName(name) {
        const { tags } = await this.getTagsData();
        return tags.find(tag => tag.name === name);
    }

    /**
     * 获取热门标签
     * @param {number} limit - 数量限制
     */
    async getPopularTags(limit = 10) {
        const { tags } = await this.getTagsData();
        return tags
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * 获取标签云数据
     */
    async getTagCloud() {
        const { tags } = await this.getTagsData();

        // 计算标签权重
        const maxCount = Math.max(...tags.map(tag => tag.count));
        const minCount = Math.min(...tags.map(tag => tag.count));

        return tags.map(tag => ({
            ...tag,
            weight: this.calculateTagWeight(tag.count, minCount, maxCount)
        }));
    }

    /**
     * 计算标签权重（用于标签云大小）
     * @param {number} count - 标签使用次数
     * @param {number} minCount - 最小使用次数
     * @param {number} maxCount - 最大使用次数
     */
    calculateTagWeight(count, minCount, maxCount) {
        if (maxCount === minCount) return 1;

        // 将权重映射到 0.5 - 2.0 的范围
        const minWeight = 0.5;
        const maxWeight = 2.0;

        return minWeight + (maxWeight - minWeight) * (count - minCount) / (maxCount - minCount);
    }

    /**
     * 搜索标签
     * @param {string} keyword - 搜索关键词
     */
    async searchTags(keyword) {
        const { tags } = await this.getTagsData();
        const searchLower = keyword.toLowerCase();

        return tags.filter(tag =>
            tag.name.toLowerCase().includes(searchLower) ||
            tag.description.toLowerCase().includes(searchLower)
        );
    }

    /**
     * 获取相关标签
     * @param {string} tagSlug - 当前标签slug
     * @param {number} limit - 返回数量
     */
    async getRelatedTags(tagSlug, limit = 5) {
        const { articles } = await this.service.article.getArticlesData();

        // 找到包含当前标签的文章
        const currentTag = await this.getTagBySlug(tagSlug);
        if (!currentTag) return [];

        const relatedArticles = articles.filter(article =>
            article.tags.includes(currentTag.name)
        );

        // 统计这些文章中其他标签的出现频率
        const tagFrequency = {};
        relatedArticles.forEach(article => {
            article.tags.forEach(tagName => {
                if (tagName !== currentTag.name) {
                    tagFrequency[tagName] = (tagFrequency[tagName] || 0) + 1;
                }
            });
        });

        // 按频率排序并返回相关标签
        const { tags } = await this.getTagsData();
        return Object.entries(tagFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([tagName]) => tags.find(tag => tag.name === tagName))
            .filter(Boolean);
    }

    /**
     * 获取标签统计信息
     */
    async getTagStats() {
        const { tags, metadata } = await this.getTagsData();
        const { articles } = await this.service.article.getArticlesData();

        // 重新计算每个标签的文章数量
        const updatedTags = tags.map(tag => {
            const tagArticles = articles.filter(article =>
                article.tags.includes(tag.name) && article.status === 'published'
            );

            return {
                ...tag,
                count: tagArticles.length,
                latestArticle: tagArticles.length > 0 ?
                    tagArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))[0] : null
            };
        });

        return {
            tags: updatedTags,
            totalTags: updatedTags.length,
            totalUsage: updatedTags.reduce((sum, tag) => sum + tag.count, 0),
            mostPopular: updatedTags.sort((a, b) => b.count - a.count)[0],
            metadata
        };
    }
}

module.exports = TagService; 