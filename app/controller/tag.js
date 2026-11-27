const { Controller } = require('egg');

class TagController extends Controller {
    // GET /api/tags/cloud
    async cloud() {
        const { ctx } = this;
        const data = await ctx.service.tag.getTagCloud();
        ctx.body = { success: true, code: 200, message: 'ok', data };
    }
}

module.exports = TagController;
