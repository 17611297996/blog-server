const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

class CategoryService extends Service {
    /**
     * 获取所有分类数据
     */
    async getCategoriesData() {
        try {
            const categoriesPath = path.join(this.app.baseDir, 'mock/categories.json');
            const data = await fs.readFile(categoriesPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('Failed to read categories data:', error);
            return { categories: [], metadata: {} };
        }
    }

    /**
     * 获取所有分类列表
     */
    async getAllCategories() {
        const { categories } = await this.getCategoriesData();
        return categories;
    }

    /**
     * 根据ID获取分类
     * @param {number} id - 分类ID
     */
    async getCategoryById(id) {
        const { categories } = await this.getCategoriesData();
        return categories.find(category => category.id == id);
    }

    /**
     * 根据slug获取分类（递归查找所有层级）
     * @param {string} slug - 分类slug
     */
    async getCategoryBySlug(slug) {
        const { categories } = await this.getCategoriesData();
        function findInTree(list) {
            for (const cat of list) {
                if (cat.slug === slug) return cat;
                if (cat.subCategories) {
                    const found = findInTree(cat.subCategories);
                    if (found) return found;
                }
            }
            return null;
        }
        return findInTree(categories);
    }

    /**
     * 获取分类树结构（用于导航菜单）
     */
    async getCategoryTree() {
        const { categories } = await this.getCategoriesData();

        // 构建树形结构
        return categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            hasSubMenu: category.hasSubMenu,
            subCategories: category.subCategories || []
        }));
    }

    /**
     * 获取主分类（用于前端导航）
     */
    async getMainCategories() {
        const { categories } = await this.getCategoriesData();
        return categories.filter(category => !category.parentId);
    }

    /**
     * 获取子分类
     * @param {number} parentId - 父分类ID
     */
    async getSubCategories(parentId) {
        const { categories } = await this.getCategoriesData();
        const parentCategory = categories.find(cat => cat.id == parentId);
        return parentCategory ? parentCategory.subCategories || [] : [];
    }

    /**
     * 获取分类统计信息
     */
    async getCategoryStats() {
        const { categories } = await this.getCategoriesData();
        const { articles } = await this.service.article.getArticlesData();

        return categories.map(category => {
            const categoryArticles = articles.filter(article =>
                article.categoryId === category.id && article.status === 'published'
            );

            return {
                ...category,
                articleCount: categoryArticles.length,
                latestArticle: categoryArticles.length > 0 ?
                    categoryArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))[0] : null
            };
        });
    }
}

module.exports = CategoryService; 