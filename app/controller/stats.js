const { Controller } = require('egg');

class StatsController extends Controller {
    // GET /api/stats
    async index() {
        const { ctx } = this;
        const data = await ctx.service.article.getStats();
        ctx.body = { success: true, code: 200, message: 'ok', data };
    }
}

module.exports = StatsController;
