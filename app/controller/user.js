const { Controller } = require('egg');

class UserController extends Controller {
    /**
     * 根据ID获取用户信息
     * GET /api/users/:id
     */
    async show() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const user = await ctx.service.user.getUserById(id);

            if (!user) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '用户不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取用户信息成功',
                data: user
            };
        } catch (error) {
            ctx.logger.error('获取用户信息失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取用户信息失败',
                error: error.message
            };
        }
    }

    /**
     * 根据用户名获取用户信息
     * GET /api/users/username/:username
     */
    async showByUsername() {
        const { ctx } = this;

        try {
            const { username } = ctx.params;
            const user = await ctx.service.user.getUserByUsername(username);

            if (!user) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '用户不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取用户信息成功',
                data: user
            };
        } catch (error) {
            ctx.logger.error('获取用户信息失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取用户信息失败',
                error: error.message
            };
        }
    }

    /**
     * 获取作者信息（包含文章统计）
     * GET /api/users/author/:identifier
     */
    async getAuthorInfo() {
        const { ctx } = this;

        try {
            const { identifier } = ctx.params;
            const authorInfo = await ctx.service.user.getAuthorInfo(identifier);

            ctx.body = {
                success: true,
                code: 200,
                message: '获取作者信息成功',
                data: authorInfo
            };
        } catch (error) {
            ctx.logger.error('获取作者信息失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取作者信息失败',
                error: error.message
            };
        }
    }

    /**
     * 获取用户文章统计
     * GET /api/users/:id/stats
     */
    async getArticleStats() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;

            // 先检查用户是否存在
            const user = await ctx.service.user.getUserById(id);
            if (!user) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '用户不存在'
                };
                return;
            }

            const stats = await ctx.service.user.getUserArticleStats(id);

            ctx.body = {
                success: true,
                code: 200,
                message: '获取用户文章统计成功',
                data: stats
            };
        } catch (error) {
            ctx.logger.error('获取用户文章统计失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取用户文章统计失败',
                error: error.message
            };
        }
    }

    /**
     * 获取所有作者列表
     * GET /api/users/authors
     */
    async getAllAuthors() {
        const { ctx } = this;

        try {
            const authors = await ctx.service.user.getAllAuthors();

            ctx.body = {
                success: true,
                code: 200,
                message: '获取作者列表成功',
                data: authors
            };
        } catch (error) {
            ctx.logger.error('获取作者列表失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取作者列表失败',
                error: error.message
            };
        }
    }
}

module.exports = UserController; 