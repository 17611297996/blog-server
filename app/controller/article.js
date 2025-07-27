const { Controller } = require('egg');

class ArticleController extends Controller {
    /**
     * 获取文章列表
     * GET /api/articles
     * Query参数：
     * - page: 页码，默认1
     * - pageSize: 每页数量，默认10
     * - category: 分类筛选
     * - tag: 标签筛选
     * - search: 搜索关键词
     * - status: 文章状态，默认published
     */
    async index() {
        const { ctx } = this;

        try {
            const {
                page = 1,
                pageSize = 10,
                category,
                tag,
                search,
                status = 'published'
            } = ctx.query;

            const options = {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                category,
                tag,
                search,
                status
            };

            const result = await ctx.service.article.getArticleList(options);

            ctx.body = {
                success: true,
                code: 200,
                message: '获取文章列表成功',
                data: result
            };
        } catch (error) {
            ctx.logger.error('获取文章列表失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取文章列表失败',
                error: error.message
            };
        }
    }

    /**
     * 获取单篇文章详情
     * GET /api/articles/:id
     */
    async show() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const article = await ctx.service.article.getArticleById(id);

            if (!article) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '文章不存在'
                };
                return;
            }

            // 检查查询参数
            const {
                includeContent = 'auto',  // auto, true, false
                checkBase64 = 'true',
                maxSize = '500'
            } = ctx.query;

            // 智能内容加载选项
            const contentOptions = {
                includeContent: includeContent === 'auto' ? true : includeContent === 'true',
                checkBase64: checkBase64 === 'true',
                maxSize: parseInt(maxSize)
            };

            // 如果是auto模式，先检查内容信息
            let content = '';
            let contentWarning = null;

            if (includeContent === 'auto') {
                const contentInfo = await ctx.service.article.getArticleContentInfo(article.content);

                if (contentInfo) {
                    // 如果文件过大或包含base64图片，给出警告但仍返回基本信息
                    const fileSizeKB = parseFloat(contentInfo.fileSizeKB);

                    if (fileSizeKB > contentOptions.maxSize) {
                        contentWarning = {
                            type: 'large_file',
                            message: `文章内容较大 (${contentInfo.fileSizeKB}KB)，建议使用 /api/articles/${article.id}/content 接口获取`,
                            fileSize: contentInfo.fileSizeKB,
                            recommendedApi: `/api/articles/${article.id}/content`
                        };
                        content = `# ${article.title}\n\n> 内容过大，请使用专门接口获取完整内容`;
                    } else if (contentInfo.hasBase64Images && contentInfo.base64ImageCount > 0) {
                        contentWarning = {
                            type: 'base64_images',
                            message: `文章包含 ${contentInfo.base64ImageCount} 个base64图片，建议先提取图片或使用原始内容接口`,
                            base64ImageCount: contentInfo.base64ImageCount,
                            estimatedSize: `${(contentInfo.estimatedBase64Size / 1024).toFixed(2)}KB`,
                            recommendedAction: '运行 npm run extract:images 提取图片'
                        };
                        content = await ctx.service.article.getArticleContent(article.content, contentOptions);
                    } else {
                        content = await ctx.service.article.getArticleContent(article.content, contentOptions);
                    }
                } else {
                    content = await ctx.service.article.getArticleContent(article.content, contentOptions);
                }
            } else {
                content = await ctx.service.article.getArticleContent(article.content, contentOptions);
            }

            // 获取作者信息
            const author = await ctx.service.user.getAuthorInfo(article.author);

            // 获取分类信息
            const category = await ctx.service.category.getCategoryById(article.categoryId);

            const responseData = {
                ...article,
                content,
                author,
                category
            };

            // 如果有内容警告，添加到响应中
            if (contentWarning) {
                responseData.contentWarning = contentWarning;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取文章详情成功',
                data: responseData
            };
        } catch (error) {
            ctx.logger.error('获取文章详情失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取文章详情失败',
                error: error.message
            };
        }
    }

    /**
     * 根据slug获取文章详情
     * GET /api/articles/slug/:slug
     */
    async showBySlug() {
        const { ctx } = this;

        try {
            const { slug } = ctx.params;
            const article = await ctx.service.article.getArticleBySlug(slug);

            if (!article) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '文章不存在'
                };
                return;
            }

            // 检查查询参数
            const {
                includeContent = 'auto',  // auto, true, false
                checkBase64 = 'true',
                maxSize = '500'
            } = ctx.query;

            // 智能内容加载选项
            const contentOptions = {
                includeContent: includeContent === 'auto' ? true : includeContent === 'true',
                checkBase64: checkBase64 === 'true',
                maxSize: parseInt(maxSize)
            };

            // 如果是auto模式，先检查内容信息
            let content = '';
            let contentWarning = null;

            if (includeContent === 'auto') {
                const contentInfo = await ctx.service.article.getArticleContentInfo(article.content);

                if (contentInfo) {
                    // 如果文件过大或包含base64图片，给出警告但仍返回基本信息
                    const fileSizeKB = parseFloat(contentInfo.fileSizeKB);

                    if (fileSizeKB > contentOptions.maxSize) {
                        contentWarning = {
                            type: 'large_file',
                            message: `文章内容较大 (${contentInfo.fileSizeKB}KB)，建议使用 /api/articles/${article.id}/content 接口获取`,
                            fileSize: contentInfo.fileSizeKB,
                            recommendedApi: `/api/articles/${article.id}/content`
                        };
                        content = `# ${article.title}\n\n> 内容过大，请使用专门接口获取完整内容`;
                    } else if (contentInfo.hasBase64Images && contentInfo.base64ImageCount > 0) {
                        contentWarning = {
                            type: 'base64_images',
                            message: `文章包含 ${contentInfo.base64ImageCount} 个base64图片，建议先提取图片或使用原始内容接口`,
                            base64ImageCount: contentInfo.base64ImageCount,
                            estimatedSize: `${(contentInfo.estimatedBase64Size / 1024).toFixed(2)}KB`,
                            recommendedAction: '运行 npm run extract:images 提取图片'
                        };
                        content = await ctx.service.article.getArticleContent(article.content, contentOptions);
                    } else {
                        content = await ctx.service.article.getArticleContent(article.content, contentOptions);
                    }
                } else {
                    content = await ctx.service.article.getArticleContent(article.content, contentOptions);
                }
            } else {
                content = await ctx.service.article.getArticleContent(article.content, contentOptions);
            }

            // 获取作者信息
            const author = await ctx.service.user.getAuthorInfo(article.author);

            // 获取分类信息
            const category = await ctx.service.category.getCategoryById(article.categoryId);

            const responseData = {
                ...article,
                content,
                author,
                category
            };

            // 如果有内容警告，添加到响应中
            if (contentWarning) {
                responseData.contentWarning = contentWarning;
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取文章详情成功',
                data: responseData
            };
        } catch (error) {
            ctx.logger.error('获取文章详情失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取文章详情失败',
                error: error.message
            };
        }
    }

    /**
     * 按分类获取文章
     * GET /api/articles/category/:categorySlug
     */
    async getByCategory() {
        const { ctx } = this;
        try {
            const { categorySlug } = ctx.params;
            const { page = 1, pageSize = 10 } = ctx.query;

            // 检查分类是否存在
            const category = await ctx.service.category.getCategoryBySlug(categorySlug);
            if (!category) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '分类不存在'
                };
                return;
            }

            const options = {
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            };

            const result = await ctx.service.article.getArticlesByCategory(categorySlug, options);

            ctx.body = {
                success: true,
                code: 200,
                message: '按分类获取文章成功',
                data: {
                    ...result,
                    category
                }
            };
        } catch (error) {
            ctx.logger.error('按分类获取文章失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '按分类获取文章失败',
                error: error.message
            };
        }
    }

    /**
     * 按标签获取文章
     * GET /api/articles/tag/:tagSlug
     */
    async getByTag() {
        const { ctx } = this;

        try {
            const { tagSlug } = ctx.params;
            const { page = 1, pageSize = 10 } = ctx.query;

            // 检查标签是否存在
            const tag = await ctx.service.tag.getTagBySlug(tagSlug);
            if (!tag) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '标签不存在'
                };
                return;
            }

            const options = {
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            };

            const result = await ctx.service.article.getArticlesByTag(tagSlug, options);

            ctx.body = {
                success: true,
                code: 200,
                message: '按标签获取文章成功',
                data: {
                    ...result,
                    tag
                }
            };
        } catch (error) {
            ctx.logger.error('按标签获取文章失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '按标签获取文章失败',
                error: error.message
            };
        }
    }

    /**
     * 搜索文章
     * GET /api/articles/search
     */
    async search() {
        const { ctx } = this;

        try {
            const {
                q: keyword,
                page = 1,
                pageSize = 10
            } = ctx.query;

            if (!keyword) {
                ctx.body = {
                    success: false,
                    code: 400,
                    message: '搜索关键词不能为空'
                };
                return;
            }

            const options = {
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            };

            const result = await ctx.service.article.searchArticles(keyword, options);

            ctx.body = {
                success: true,
                code: 200,
                message: '搜索文章成功',
                data: {
                    ...result,
                    keyword
                }
            };
        } catch (error) {
            ctx.logger.error('搜索文章失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '搜索文章失败',
                error: error.message
            };
        }
    }

    /**
     * 获取热门文章
     * GET /api/articles/popular
     */
    async popular() {
        const { ctx } = this;

        try {
            const { limit = 5 } = ctx.query;
            const articles = await ctx.service.article.getPopularArticles(parseInt(limit));

            ctx.body = {
                success: true,
                code: 200,
                message: '获取热门文章成功',
                data: articles
            };
        } catch (error) {
            ctx.logger.error('获取热门文章失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取热门文章失败',
                error: error.message
            };
        }
    }

    /**
     * 获取推荐文章
     * GET /api/articles/featured
     */
    async featured() {
        const { ctx } = this;

        try {
            const { limit = 5 } = ctx.query;
            const articles = await ctx.service.article.getFeaturedArticles(parseInt(limit));

            ctx.body = {
                success: true,
                code: 200,
                message: '获取推荐文章成功',
                data: articles
            };
        } catch (error) {
            ctx.logger.error('获取推荐文章失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取推荐文章失败',
                error: error.message
            };
        }
    }

    /**
     * 获取最新文章
     * GET /api/articles/latest
     */
    async latest() {
        const { ctx } = this;

        try {
            const { limit = 5 } = ctx.query;
            const articles = await ctx.service.article.getLatestArticles(parseInt(limit));

            ctx.body = {
                success: true,
                code: 200,
                message: '获取最新文章成功',
                data: articles
            };
        } catch (error) {
            ctx.logger.error('获取最新文章失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取最新文章失败',
                error: error.message
            };
        }
    }

    /**
     * 获取文章原始内容（专用于大文件）
     * GET /api/articles/:id/content
     */
    async getContent() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const article = await ctx.service.article.getArticleById(id);

            if (!article) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '文章不存在'
                };
                return;
            }

            // 获取原始内容（不做任何限制）
            const content = await ctx.service.article.getArticleRawContent(article.content);

            ctx.body = {
                success: true,
                code: 200,
                message: '获取文章内容成功',
                data: {
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    content,
                    contentType: 'markdown'
                }
            };
        } catch (error) {
            ctx.logger.error('获取文章内容失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取文章内容失败',
                error: error.message
            };
        }
    }

    /**
     * 获取文章内容信息（用于性能分析）
     * GET /api/articles/:id/info
     */
    async getContentInfo() {
        const { ctx } = this;

        try {
            const { id } = ctx.params;
            const article = await ctx.service.article.getArticleById(id);

            if (!article) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    code: 404,
                    message: '文章不存在'
                };
                return;
            }

            // 获取内容信息
            const contentInfo = await ctx.service.article.getArticleContentInfo(article.content);

            if (!contentInfo) {
                ctx.body = {
                    success: false,
                    code: 500,
                    message: '获取文章信息失败'
                };
                return;
            }

            // 生成建议
            const recommendations = [];

            if (contentInfo.hasBase64Images) {
                recommendations.push({
                    type: 'extract_images',
                    message: `建议提取 ${contentInfo.base64ImageCount} 个base64图片以提升性能`,
                    action: 'npm run extract:images',
                    estimatedSaving: `约 ${(contentInfo.estimatedBase64Size / 1024).toFixed(2)}KB`
                });
            }

            const fileSizeKB = parseFloat(contentInfo.fileSizeKB);
            if (fileSizeKB > 500) {
                recommendations.push({
                    type: 'use_content_api',
                    message: '文件较大，建议使用专用内容接口',
                    action: `GET /api/articles/${id}/content`,
                    currentSize: `${contentInfo.fileSizeKB}KB`
                });
            }

            ctx.body = {
                success: true,
                code: 200,
                message: '获取文章信息成功',
                data: {
                    articleId: article.id,
                    title: article.title,
                    slug: article.slug,
                    contentInfo,
                    recommendations,
                    apis: {
                        optimized: `/api/articles/${id}?includeContent=auto`,
                        content: `/api/articles/${id}/content`,
                        noContent: `/api/articles/${id}?includeContent=false`
                    }
                }
            };
        } catch (error) {
            ctx.logger.error('获取文章信息失败:', error);
            ctx.body = {
                success: false,
                code: 500,
                message: '获取文章信息失败',
                error: error.message
            };
        }
    }
}

module.exports = ArticleController; 