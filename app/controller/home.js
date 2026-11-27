const { Controller } = require('egg');

class HomeController extends Controller {
    async index() {
        this.ctx.body = { name: 'blog-server', status: 'running' };
    }
}

module.exports = HomeController;
