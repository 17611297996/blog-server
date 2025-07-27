/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // 首页
  router.get('/', controller.home.index);

  // ========== 文章相关路由 ==========

  // 获取文章列表（支持分页、搜索、筛选）
  router.get('/api/articles', controller.article.index);

  // 搜索文章
  router.get('/api/articles/search', controller.article.search);

  // 获取热门文章
  router.get('/api/articles/popular', controller.article.popular);

  // 获取推荐文章
  router.get('/api/articles/featured', controller.article.featured);

  // 获取最新文章
  router.get('/api/articles/latest', controller.article.latest);

  // 根据slug获取文章详情
  router.get('/api/articles/slug/:slug', controller.article.showBySlug);

  // 获取文章原始内容（专用于大文件）
  router.get('/api/articles/:id/content', controller.article.getContent);

  // 获取文章内容信息（性能分析）
  router.get('/api/articles/:id/info', controller.article.getContentInfo);

  // 按分类获取文章
  router.get('/api/articles/category/:categorySlug', controller.article.getByCategory);

  // 按标签获取文章
  router.get('/api/articles/tag/:tagSlug', controller.article.getByTag);

  // 根据ID获取文章详情（需要放在最后，避免与其他路由冲突）
  router.get('/api/articles/:id', controller.article.show);

  // ========== 分类相关路由 ==========

  // 获取分类树结构（用于导航菜单）
  router.get('/api/categories/tree', controller.category.tree);

  // 获取分类统计信息
  router.get('/api/categories/stats', controller.category.stats);

  // 获取主分类列表
  router.get('/api/categories/main', controller.category.main);

  // 根据slug获取分类详情
  router.get('/api/categories/slug/:slug', controller.category.showBySlug);

  // 获取子分类列表
  router.get('/api/categories/:id/children', controller.category.children);

  // 获取所有分类列表
  router.get('/api/categories', controller.category.index);

  // 根据ID获取分类详情
  router.get('/api/categories/:id', controller.category.show);

  // ========== 标签相关路由 ==========

  // 获取热门标签
  router.get('/api/tags/popular', controller.tag.popular);

  // 获取标签云数据
  router.get('/api/tags/cloud', controller.tag.cloud);

  // 搜索标签
  router.get('/api/tags/search', controller.tag.search);

  // 获取标签统计信息
  router.get('/api/tags/stats', controller.tag.stats);

  // 根据slug获取标签详情
  router.get('/api/tags/slug/:slug', controller.tag.showBySlug);

  // 获取相关标签
  router.get('/api/tags/:slug/related', controller.tag.related);

  // 获取所有标签列表
  router.get('/api/tags', controller.tag.index);

  // 根据ID获取标签详情
  router.get('/api/tags/:id', controller.tag.show);

  // ========== 用户相关路由 ==========

  // 获取所有作者列表
  router.get('/api/users/authors', controller.user.getAllAuthors);

  // 根据用户名获取用户信息
  router.get('/api/users/username/:username', controller.user.showByUsername);

  // 获取作者信息（包含文章统计）
  router.get('/api/users/author/:identifier', controller.user.getAuthorInfo);

  // 获取用户文章统计
  router.get('/api/users/:id/stats', controller.user.getArticleStats);

  // 根据ID获取用户信息
  router.get('/api/users/:id', controller.user.show);



};
