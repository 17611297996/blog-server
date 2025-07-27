const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');

class UserService extends Service {
    /**
     * 获取所有用户数据
     */
    async getUsersData() {
        try {
            const usersPath = path.join(this.app.baseDir, 'mock/users.json');
            const data = await fs.readFile(usersPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('Failed to read users data:', error);
            return { users: [], metadata: {} };
        }
    }

    /**
     * 根据ID获取用户
     * @param {number} id - 用户ID
     */
    async getUserById(id) {
        const { users } = await this.getUsersData();
        const user = users.find(user => user.id == id);

        if (user) {
            // 移除敏感信息
            const { password, ...safeUser } = user;
            return safeUser;
        }

        return null;
    }

    /**
     * 根据用户名获取用户
     * @param {string} username - 用户名
     */
    async getUserByUsername(username) {
        const { users } = await this.getUsersData();
        const user = users.find(user => user.username === username);

        if (user) {
            // 移除敏感信息
            const { password, ...safeUser } = user;
            return safeUser;
        }

        return null;
    }

    /**
     * 获取用户的文章统计
     * @param {number} userId - 用户ID
     */
    async getUserArticleStats(userId) {
        const { articles } = await this.service.article.getArticlesData();

        const userArticles = articles.filter(article => article.author === userId || article.authorId === userId);
        const publishedArticles = userArticles.filter(article => article.status === 'published');
        const draftArticles = userArticles.filter(article => article.status === 'draft');

        // 计算总阅读量
        const totalViews = userArticles.reduce((sum, article) => sum + (article.views || 0), 0);
        const totalLikes = userArticles.reduce((sum, article) => sum + (article.likes || 0), 0);

        return {
            totalArticles: userArticles.length,
            publishedArticles: publishedArticles.length,
            draftArticles: draftArticles.length,
            totalViews,
            totalLikes,
            latestArticle: publishedArticles.length > 0 ?
                publishedArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))[0] : null
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
            bio: '',
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
        const { articles } = await this.service.article.getArticlesData();

        // 找出所有有文章的作者
        const authorsWithArticles = [];

        for (const user of users) {
            const userArticles = articles.filter(article =>
                article.author === user.username || article.authorId === user.id
            );

            if (userArticles.length > 0) {
                const stats = await this.getUserArticleStats(user.id);
                const { password, ...safeUser } = user;

                authorsWithArticles.push({
                    ...safeUser,
                    stats
                });
            }
        }

        return authorsWithArticles.sort((a, b) => b.stats.totalArticles - a.stats.totalArticles);
    }
}

module.exports = UserService; 