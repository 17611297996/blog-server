module.exports = app => {
    const { router, controller, middleware } = app;
    const auth = middleware.auth();

    // ===== 前台只读接口 =====
    router.get('/', controller.home.index);
    router.get('/api/articles', controller.article.index);
    router.get('/api/articles/search', controller.article.search);
    router.get('/api/articles/:id', controller.article.show);
    router.get('/api/categories/tree', controller.category.tree);
    router.get('/api/tags/cloud', controller.tag.cloud);
    router.get('/api/stats', controller.stats.index);

    // ===== 后台接口 =====
    // 登录（无需 auth）
    router.post('/api/admin/login', controller.admin.login);

    // 以下全部需要 auth
    router.get('/api/admin/dashboard', auth, controller.admin.dashboard);

    // 文章管理
    router.get('/api/admin/articles', auth, controller.admin.articleList);
    router.get('/api/admin/articles/:id', auth, controller.admin.articleDetail);
    router.post('/api/admin/articles', auth, controller.admin.articleCreate);
    router.put('/api/admin/articles/:id', auth, controller.admin.articleUpdate);
    router.del('/api/admin/articles/:id', auth, controller.admin.articleDelete);
    router.patch('/api/admin/articles/:id/status', auth, controller.admin.articleStatus);

    // 分类管理
    router.get('/api/admin/categories', auth, controller.admin.categoryList);
    router.post('/api/admin/categories', auth, controller.admin.categoryCreate);
    router.put('/api/admin/categories/:id', auth, controller.admin.categoryUpdate);
    router.del('/api/admin/categories/:id', auth, controller.admin.categoryDelete);

    // 图片管理
    router.post('/api/admin/upload', auth, controller.admin.imageUpload);
    router.get('/api/admin/images', auth, controller.admin.imageList);
    router.del('/api/admin/images/:filename', auth, controller.admin.imageDelete);
    router.post('/api/admin/images/cleanup', auth, controller.admin.imageCleanup);
};
