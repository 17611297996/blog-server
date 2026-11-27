const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

let _cache = null;

class TagService extends Service {
    async getTagsData() {
        if (_cache) return _cache;
        try {
            const tagsPath = path.join(this.app.baseDir, 'mock/tags.json');
            const data = await fs.readFile(tagsPath, 'utf-8');
            _cache = JSON.parse(data);
            return _cache;
        } catch (error) {
            this.logger.error('Failed to read tags data:', error);
            return { tags: [] };
        }
    }

    async getTagBySlug(slug) {
        const { tags } = await this.getTagsData();
        return tags.find(t => t.slug === slug) || null;
    }

    async getTagCloud() {
        const { tags } = await this.getTagsData();
        const { articles } = await this.service.article.getArticlesData();
        const published = articles.filter(a => a.status === 'published');

        const counts = {};
        published.forEach(a => a.tags.forEach(name => { counts[name] = (counts[name] || 0) + 1; }));

        const enriched = tags.map(t => ({ ...t, count: counts[t.name] || t.count || 0 }));
        const max = Math.max(...enriched.map(t => t.count), 1);
        const min = Math.min(...enriched.map(t => t.count), 0);

        return enriched.map(t => ({
            ...t,
            weight: max === min ? 1 : 0.5 + 1.5 * (t.count - min) / (max - min),
        })).sort((a, b) => b.count - a.count);
    }
}

module.exports = TagService;
