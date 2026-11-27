const { Controller } = require('egg');

class CategoryController extends Controller {
    // GET /api/categories/tree
    async tree() {
        const { ctx } = this;
        const data = await ctx.service.category.getCategoryTree();
        ctx.body = { success: true, code: 200, message: 'ok', data };
    }
}

module.exports = CategoryController;
