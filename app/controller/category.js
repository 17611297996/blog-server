const { Controller } = require('egg');

class CategoryController extends Controller {
    /**
     * 获取所有分类列表
     * GET /api/categories
     */
    async index() {
        const { ctx } = this;

        try {
            const categories = await ctx.service.category.getAllCategories();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取分类列表成功',
                data: categories
            };
        } catch (error) {
            ctx.logger.error('获取分类列表失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取分类列表失败',
                error: error.message
            };
        }
    }

    /**
     * 获取分类树结构（用于导航菜单）
     * GET /api/categories/tree
     */
    async tree() {
        const { ctx } = this;

        try {
            const categoryTree = await ctx.service.category.getCategoryTree();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取分类树成功',
                data: categoryTree
            };
        } catch (error) {
            ctx.logger.error('获取分类树失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取分类树失败',
                error: error.message
            };
        }
    }

    /**
     * 获取分类统计信息
     * GET /api/categories/stats
     */
    async stats() {
        const { ctx } = this;

        try {
            const categoryStats = await ctx.service.category.getCategoryStats();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取分类统计成功',
                data: categoryStats
            };
        } catch (error) {
            ctx.logger.error('获取分类统计失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取分类统计失败',
                error: error.message
            };
        }
    }

    /**
     * 根据ID获取单个分类详情
     * GET /api/categories/:id
     */
    async show() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const category = await ctx.service.category.getCategoryById(id);

            if (!category) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '分类不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取分类详情成功',
                data: category
            };
        } catch (error) {
            ctx.logger.error('获取分类详情失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取分类详情失败',
                error: error.message
            };
        }
    }

    /**
     * 根据slug获取分类详情
     * GET /api/categories/slug/:slug
     */
    async showBySlug() {
        const { ctx } = this;

        try {
            const { slug } = ctx.params;
            const category = await ctx.service.category.getCategoryBySlug(slug);

            if (!category) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '分类不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取分类详情成功',
                data: category
            };
        } catch (error) {
            ctx.logger.error('获取分类详情失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取分类详情失败',
                error: error.message
            };
        }
    }

    /**
     * 获取主分类列表
     * GET /api/categories/main
     */
    async main() {
        const { ctx } = this;

        try {
            const mainCategories = await ctx.service.category.getMainCategories();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取主分类列表成功',
                data: mainCategories
            };
        } catch (error) {
            ctx.logger.error('获取主分类列表失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取主分类列表失败',
                error: error.message
            };
        }
    }

    /**
     * 获取子分类列表
     * GET /api/categories/:id/children
     */
    async children() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const subCategories = await ctx.service.category.getSubCategories(id);

            ctx.body = {
                success: true,
                code: 200,
                message: '获取子分类列表成功',
                data: subCategories
            };
        } catch (error) {
            ctx.logger.error('获取子分类列表失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取子分类列表失败',
                error: error.message
            };
        }
    }
}

module.exports = CategoryController; 