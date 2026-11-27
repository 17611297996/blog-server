const { Controller } = require('egg');

class ArticleController extends Controller {
    // GET /api/articles
    async index() {
        const { ctx } = this;
        const { page = 1, pageSize = 10, category, tag, search, status = 'published' } = ctx.query;
        const result = await ctx.service.article.getArticleList({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            category,
            tag,
            search,
            status,
        });
        ctx.body = { success: true, code: 200, message: 'ok', data: result };
    }

    // GET /api/articles/search
    async search() {
        const { ctx } = this;
        const { q, page = 1, pageSize = 10 } = ctx.query;
        if (!q) {
            ctx.status = 400;
            ctx.body = { success: false, code: 400, message: '搜索关键词不能为空' };
            return;
        }
        const result = await ctx.service.article.searchArticles(q, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
        ctx.body = { success: true, code: 200, message: 'ok', data: { ...result, keyword: q } };
    }

    // GET /api/articles/:id
    async show() {
        const { ctx } = this;
        const article = await ctx.service.article.getArticleById(ctx.params.id);
        if (!article) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '文章不存在' };
            return;
        }
        const category = await ctx.service.category.getCategoryById(article.categoryId);
        ctx.body = { success: true, code: 200, message: 'ok', data: { ...article, category } };
    }
}

module.exports = ArticleController;
