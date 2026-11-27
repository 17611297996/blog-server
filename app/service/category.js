const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

let _cache = null;

class CategoryService extends Service {
    async getCategoriesData() {
        if (_cache) return _cache;
        try {
            const filePath = path.join(this.app.baseDir, 'mock/categories.json');
            const data = await fs.readFile(filePath, 'utf-8');
            _cache = JSON.parse(data);
            return _cache;
        } catch (error) {
            this.logger.error('Failed to read categories data:', error);
            return { categories: [] };
        }
    }

    async getCategoryById(id) {
        const { categories } = await this.getCategoriesData();
        const findById = (list) => {
            for (const c of list) {
                if (c.id == id) return c;
                if (c.subCategories) { const r = findById(c.subCategories); if (r) return r; }
            }
            return null;
        };
        return findById(categories);
    }

    async getCategoryBySlug(slug) {
        const { categories } = await this.getCategoriesData();
        const find = (list) => {
            for (const c of list) {
                if (c.slug === slug) return c;
                if (c.subCategories) { const r = find(c.subCategories); if (r) return r; }
            }
            return null;
        };
        return find(categories);
    }

    async getCategoryTree() {
        const { categories } = await this.getCategoriesData();
        const { articles } = await this.service.article.getArticlesData();
        const published = articles.filter(a => a.status === 'published');

        const countForSlug = (slug) =>
            published.filter(a => a.categorySlugs && a.categorySlugs.includes(slug)).length;

        return categories.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            articleCount: countForSlug(c.slug),
            hasSubMenu: !!(c.subCategories && c.subCategories.length),
            subCategories: (c.subCategories || []).map(s => ({
                id: s.id,
                name: s.name,
                slug: s.slug,
                description: s.description,
                articleCount: countForSlug(s.slug),
            })),
        }));
    }
}

module.exports = CategoryService;
