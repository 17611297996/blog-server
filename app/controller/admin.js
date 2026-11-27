const { Controller } = require('egg');
const { createToken } = require('../middleware/auth');

class AdminController extends Controller {

    // ===== 登录 =====
    // POST /api/admin/login
    async login() {
        const { ctx, app } = this;
        const { password } = ctx.request.body;
        if (password !== app.config.admin.password) {
            ctx.status = 401;
            ctx.body = { success: false, code: 401, message: '密码错误' };
            return;
        }
        const token = createToken(app);
        ctx.body = { success: true, code: 200, message: '登录成功', data: { token } };
    }

    // ===== Dashboard =====
    // GET /api/admin/dashboard
    async dashboard() {
        const { ctx } = this;
        const data = await ctx.service.admin.getDashboardStats();
        ctx.body = { success: true, code: 200, message: 'ok', data };
    }

    // ===== 文章列表（含草稿）=====
    // GET /api/admin/articles
    async articleList() {
        const { ctx } = this;
        const { page = 1, pageSize = 20, status, search } = ctx.query;
        const data = await ctx.service.admin.getArticleList({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            status,
            search,
        });
        ctx.body = { success: true, code: 200, message: 'ok', data };
    }

    // GET /api/admin/articles/:id
    async articleDetail() {
        const { ctx } = this;
        const article = await ctx.service.admin.getArticleById(ctx.params.id);
        if (!article) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '文章不存在' };
            return;
        }
        ctx.body = { success: true, code: 200, message: 'ok', data: article };
    }

    // POST /api/admin/articles
    async articleCreate() {
        const { ctx } = this;
        const body = ctx.request.body;
        if (!body.title?.trim()) {
            ctx.status = 400;
            ctx.body = { success: false, code: 400, message: '标题不能为空' };
            return;
        }
        const article = await ctx.service.admin.createArticle(body);
        ctx.body = { success: true, code: 200, message: '创建成功', data: article };
    }

    // PUT /api/admin/articles/:id
    async articleUpdate() {
        const { ctx } = this;
        const article = await ctx.service.admin.updateArticle(ctx.params.id, ctx.request.body);
        if (!article) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '文章不存在' };
            return;
        }
        ctx.body = { success: true, code: 200, message: '更新成功', data: article };
    }

    // DELETE /api/admin/articles/:id
    async articleDelete() {
        const { ctx } = this;
        const ok = await ctx.service.admin.deleteArticle(ctx.params.id);
        if (!ok) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '文章不存在' };
            return;
        }
        ctx.body = { success: true, code: 200, message: '删除成功' };
    }

    // PATCH /api/admin/articles/:id/status
    async articleStatus() {
        const { ctx } = this;
        const { status } = ctx.request.body;
        if (!['published', 'draft'].includes(status)) {
            ctx.status = 400;
            ctx.body = { success: false, code: 400, message: 'status 只能是 published 或 draft' };
            return;
        }
        const article = await ctx.service.admin.updateArticle(ctx.params.id, { status });
        if (!article) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '文章不存在' };
            return;
        }
        ctx.body = { success: true, code: 200, message: '状态更新成功', data: { id: article.id, status: article.status } };
    }

    // ===== 分类 =====
    // GET /api/admin/categories
    async categoryList() {
        const { ctx } = this;
        const data = await ctx.service.admin.readCategoriesData();
        ctx.body = { success: true, code: 200, message: 'ok', data: data.categories };
    }

    // POST /api/admin/categories
    async categoryCreate() {
        const { ctx } = this;
        const { name, slug, description, parentId } = ctx.request.body;
        if (!name?.trim()) {
            ctx.status = 400;
            ctx.body = { success: false, code: 400, message: '分类名称不能为空' };
            return;
        }
        const cat = await ctx.service.admin.createCategory({ name, slug, description, parentId });
        ctx.body = { success: true, code: 200, message: '创建成功', data: cat };
    }

    // PUT /api/admin/categories/:id
    async categoryUpdate() {
        const { ctx } = this;
        const cat = await ctx.service.admin.updateCategory(ctx.params.id, ctx.request.body);
        if (!cat) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '分类不存在' };
            return;
        }
        ctx.body = { success: true, code: 200, message: '更新成功', data: cat };
    }

    // DELETE /api/admin/categories/:id
    async categoryDelete() {
        const { ctx } = this;
        const result = await ctx.service.admin.deleteCategory(ctx.params.id);
        if (!result.ok) {
            ctx.status = 400;
            ctx.body = { success: false, code: 400, message: result.reason };
            return;
        }
        ctx.body = { success: true, code: 200, message: '删除成功' };
    }

    // ===== 图片 =====
    // POST /api/admin/upload
    async imageUpload() {
        const { ctx } = this;
        const file = ctx.request.files?.[0];
        if (!file) {
            ctx.status = 400;
            ctx.body = { success: false, code: 400, message: '未上传文件' };
            return;
        }
        const result = await ctx.service.admin.saveUploadedImage(file);
        ctx.body = { success: true, code: 200, message: '上传成功', data: result };
    }

    // GET /api/admin/images
    async imageList() {
        const { ctx } = this;
        const data = await ctx.service.admin.getImageList();
        ctx.body = { success: true, code: 200, message: 'ok', data };
    }

    // DELETE /api/admin/images/:filename
    async imageDelete() {
        const { ctx } = this;
        const { filename } = ctx.params;
        // 检查是否还有文章引用
        const images = await ctx.service.admin.getImageList();
        const img = images.find(i => i.filename === filename);
        if (img?.refs?.length > 0) {
            ctx.status = 400;
            ctx.body = {
                success: false,
                code: 400,
                message: `该图片还被 ${img.refs.length} 篇文章引用，删除后图片将无法显示`,
                data: { refs: img.refs },
            };
            return;
        }
        const ok = await ctx.service.admin.deleteImage(filename);
        if (!ok) {
            ctx.status = 404;
            ctx.body = { success: false, code: 404, message: '图片不存在' };
            return;
        }
        ctx.body = { success: true, code: 200, message: '删除成功' };
    }

    // POST /api/admin/images/cleanup
    async imageCleanup() {
        const { ctx } = this;
        const deleted = await ctx.service.admin.cleanupOrphanImages();
        ctx.body = {
            success: true,
            code: 200,
            message: `清理完成，删除了 ${deleted.length} 张孤儿图片`,
            data: { deleted },
        };
    }
}

module.exports = AdminController;
