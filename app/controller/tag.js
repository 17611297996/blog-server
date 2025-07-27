const { Controller } = require('egg');

class TagController extends Controller {
    /**
     * 获取所有标签列表
     * GET /api/tags
     */
    async index() {
        const { ctx } = this;

        try {
            const tags = await ctx.service.tag.getAllTags();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取标签列表成功',
                data: tags
            };
        } catch (error) {
            ctx.logger.error('获取标签列表失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取标签列表失败',
                error: error.message
            };
        }
    }

    /**
     * 根据ID获取单个标签详情
     * GET /api/tags/:id
     */
    async show() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const tag = await ctx.service.tag.getTagById(id);

            if (!tag) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '标签不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取标签详情成功',
                data: tag
            };
        } catch (error) {
            ctx.logger.error('获取标签详情失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取标签详情失败',
                error: error.message
            };
        }
    }

    /**
     * 根据slug获取标签详情
     * GET /api/tags/slug/:slug
     */
    async showBySlug() {
        const { ctx } = this;

        try {
            const { slug } = ctx.params;
            const tag = await ctx.service.tag.getTagBySlug(slug);

            if (!tag) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '标签不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取标签详情成功',
                data: tag
            };
        } catch (error) {
            ctx.logger.error('获取标签详情失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取标签详情失败',
                error: error.message
            };
        }
    }

    /**
     * 获取热门标签
     * GET /api/tags/popular
     */
    async popular() {
        const { ctx } = this;

        try {
            const { limit = 10 } = ctx.query;
            const popularTags = await ctx.service.tag.getPopularTags(parseInt(limit));

            ctx.body = {
                success: true,
                code: 200,
                message: '获取热门标签成功',
                data: popularTags
            };
        } catch (error) {
            ctx.logger.error('获取热门标签失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取热门标签失败',
                error: error.message
            };
        }
    }

    /**
     * 获取标签云数据
     * GET /api/tags/cloud
     */
    async cloud() {
        const { ctx } = this;

        try {
            const tagCloud = await ctx.service.tag.getTagCloud();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取标签云成功',
                data: tagCloud
            };
        } catch (error) {
            ctx.logger.error('获取标签云失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取标签云失败',
                error: error.message
            };
        }
    }

    /**
     * 搜索标签
     * GET /api/tags/search
     */
    async search() {
        const { ctx } = this;

        try {
            const { q: keyword } = ctx.query;

            if (!keyword) {
                ctx.body = {
                    success: false,
                    code: 400,
                    message: '搜索关键词不能为空'
                };
                return;
            }

            const tags = await ctx.service.tag.searchTags(keyword);

            ctx.body = {
                success: true,
                code: 200,
                message: '搜索标签成功',
                data: {
                    tags,
                    keyword
                }
            };
        } catch (error) {
            ctx.logger.error('搜索标签失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '搜索标签失败',
                error: error.message
            };
        }
    }

    /**
     * 获取相关标签
     * GET /api/tags/:slug/related
     */
    async related() {
        const { ctx } = this;

        try {
            const { slug } = ctx.params;
            const { limit = 5 } = ctx.query;

            const relatedTags = await ctx.service.tag.getRelatedTags(slug, parseInt(limit));

            ctx.body = {
                success: true,
                code: 200,
                message: '获取相关标签成功',
                data: relatedTags
            };
        } catch (error) {
            ctx.logger.error('获取相关标签失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取相关标签失败',
                error: error.message
            };
        }
    }

    /**
     * 获取标签统计信息
     * GET /api/tags/stats
     */
    async stats() {
        const { ctx } = this;

        try {
            const tagStats = await ctx.service.tag.getTagStats();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取标签统计成功',
                data: tagStats
            };
        } catch (error) {
            ctx.logger.error('获取标签统计失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取标签统计失败',
                error: error.message
            };
        }
    }
}

module.exports = TagController; 