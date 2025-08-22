const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

class UserService extends Service {
    /**
     * 获取所有用户数据
     */
    async getUsersData() {
        try {
            const filePath = path.join(this.app.baseDir, 'mock/users.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            this.ctx.logger.error('读取用户数据失败:', error);
            return { users: [] };
        }
    }

    /**
     * 根据ID获取用户信息
     */
    async getUserById(id) {
        const { users } = await this.getUsersData();
        return users.find(user => user.id === parseInt(id));
    }

    /**
     * 根据用户名获取用户信息
     */
    async getUserByUsername(username) {
        const { users } = await this.getUsersData();
        return users.find(user => user.username === username);
    }

    /**
     * 获取用户文章统计（动态计算）
     */
    async getUserArticleStats(userId) {
        // 获取文章数据
        const articlesData = await this.ctx.service.article.getArticlesData();
        const userArticles = articlesData.articles.filter(article =>
            article.author === userId || article.authorId === userId
        );

        // 计算统计信息
        const totalArticles = userArticles.length;
        const publishedArticles = userArticles.filter(article => article.status === 'published').length;
        const draftArticles = totalArticles - publishedArticles;

        // 获取最新文章
        const latestArticle = userArticles
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))[0];

        return {
            totalArticles,
            publishedArticles,
            draftArticles,
            totalViews: 0, // 如果需要可以后续添加浏览量统计
            totalLikes: 0, // 如果需要可以后续添加点赞统计
            latestArticle: latestArticle ? {
                id: latestArticle.id,
                title: latestArticle.title,
                publishDate: latestArticle.publishDate
            } : null
        };
    }

    /**
     * 获取作者信息（用于文章详情页）
     * @param {string} authorIdentifier - 作者标识（可能是用户名或ID）
     */
    async getAuthorInfo(authorIdentifier) {
        // 先尝试按用户名查找
        let author = await this.getUserByUsername(authorIdentifier);

        // 如果没找到，尝试按ID查找
        if (!author && !isNaN(authorIdentifier)) {
            author = await this.getUserById(parseInt(authorIdentifier));
        }

        if (author) {
            // 获取作者的文章统计
            const stats = await this.getUserArticleStats(author.id);

            return {
                ...author,
                stats
            };
        }

        // 如果都没找到，返回默认作者信息
        return {
            id: 0,
            username: authorIdentifier,
            displayName: authorIdentifier,
            avatar: '',
            stats: {
                totalArticles: 0,
                publishedArticles: 0,
                draftArticles: 0,
                totalViews: 0,
                totalLikes: 0,
                latestArticle: null
            }
        };
    }

    /**
     * 获取所有作者列表
     */
    async getAllAuthors() {
        const { users } = await this.getUsersData();

        // 为每个作者添加统计信息
        const authorsWithStats = await Promise.all(
            users.map(async (user) => {
                const stats = await this.getUserArticleStats(user.id);
                return {
                    ...user,
                    stats
                };
            })
        );

        // 按文章数量排序
        return authorsWithStats
            .filter(author => author.stats.totalArticles > 0)
            .sort((a, b) => b.stats.totalArticles - a.stats.totalArticles);
    }
}

module.exports = UserService; 