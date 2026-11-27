const { Service } = require('egg');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const articleModule = require('./article');

class AdminService extends Service {

    // ==================== 工具方法 ====================

    get articlesPath() {
        return path.join(this.app.baseDir, 'mock/articles.json');
    }
    get categoriesPath() {
        return path.join(this.app.baseDir, 'mock/categories.json');
    }
    get imagesDir() {
        return path.join(this.app.baseDir, 'content/assets/images');
    }
    get imageMetaPath() {
        return path.join(this.app.baseDir, 'content/assets/images/meta.json');
    }

    async readArticlesData() {
        const raw = await fs.readFile(this.articlesPath, 'utf-8');
        return JSON.parse(raw);
    }

    async writeArticlesData(data) {
        await fs.writeFile(this.articlesPath, JSON.stringify(data, null, 2), 'utf-8');
        articleModule._clearCache && articleModule._clearCache();
    }

    async readCategoriesData() {
        const raw = await fs.readFile(this.categoriesPath, 'utf-8');
        return JSON.parse(raw);
    }

    async writeCategoriesData(data) {
        await fs.writeFile(this.categoriesPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async readImageMeta() {
        try {
            const raw = await fs.readFile(this.imageMetaPath, 'utf-8');
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    async writeImageMeta(meta) {
        await fs.writeFile(this.imageMetaPath, JSON.stringify(meta, null, 2), 'utf-8');
    }

    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    generateSlug(title) {
        // 移除 emoji，转小写，空格转横杠
        return title
            .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
            .replace(/[^\w一-龥\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 60) || `article-${Date.now()}`;
    }

    // ==================== 文章管理 ====================

    async getArticleList({ page = 1, pageSize = 20, status, search } = {}) {
        const { articles } = await this.readArticlesData();
        let list = [...articles];

        if (status) list = list.filter(a => a.status === status);
        if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

        list.sort((a, b) => new Date(b.updateDate || b.publishDate) - new Date(a.updateDate || a.publishDate));

        const total = list.length;
        const totalPages = Math.ceil(total / pageSize);
        const items = list.slice((page - 1) * pageSize, page * pageSize).map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            categorySlug: a.categorySlug,
            tags: a.tags,
            status: a.status,
            publishDate: a.publishDate,
            updateDate: a.updateDate,
            views: a.views,
            featured: a.featured,
            coverImage: a.coverImage,
        }));

        return { articles: items, pagination: { current: page, pageSize, total, totalPages } };
    }

    async getArticleById(id) {
        const { articles } = await this.readArticlesData();
        return articles.find(a => a.id == id) || null;
    }

    async createArticle({ title, content, excerpt, categorySlug, categorySlugs, tags, status, featured, coverImage }) {
        const data = await this.readArticlesData();
        const now = new Date().toISOString();
        const id = this.generateId();
        const slug = this.generateSlug(title);

        // 找 categoryId
        const catData = await this.readCategoriesData();
        const allCats = this._flatCategories(catData.categories);
        const cat = allCats.find(c => c.slug === categorySlug);

        const article = {
            id,
            title,
            slug,
            excerpt: excerpt || content.substring(0, 150).replace(/[#*`>\n]/g, '').trim() + '...',
            content,
            categoryId: cat?.id || 0,
            categorySlug: categorySlug || '',
            categorySlugs: categorySlugs || [categorySlug],
            tags: tags || [],
            author: 'admin',
            publishDate: now,
            updateDate: now,
            status: status || 'draft',
            views: 0,
            likes: 0,
            featured: featured || false,
            coverImage: coverImage || '',
        };

        data.articles.unshift(article);
        await this.writeArticlesData(data);
        await this._writeMdFile(slug, categorySlug, content);

        return article;
    }

    async updateArticle(id, fields) {
        const data = await this.readArticlesData();
        const idx = data.articles.findIndex(a => a.id == id);
        if (idx === -1) return null;

        const old = data.articles[idx];
        const now = new Date().toISOString();

        // 自动更新摘要
        if (fields.content && !fields.excerpt) {
            fields.excerpt = fields.content.substring(0, 150).replace(/[#*`>\n]/g, '').trim() + '...';
        }

        const updated = { ...old, ...fields, updateDate: now };
        data.articles[idx] = updated;
        await this.writeArticlesData(data);

        if (fields.content) {
            await this._writeMdFile(updated.slug, updated.categorySlug, fields.content);
        }

        return updated;
    }

    async deleteArticle(id) {
        const data = await this.readArticlesData();
        const idx = data.articles.findIndex(a => a.id == id);
        if (idx === -1) return false;

        const article = data.articles[idx];
        data.articles.splice(idx, 1);
        await this.writeArticlesData(data);

        // 删除 .md 文件（不强制，失败不抛错）
        try {
            const mdPath = path.join(this.app.baseDir, 'content/articles', article.categorySlug, `${article.slug}.md`);
            await fs.unlink(mdPath);
        } catch {}

        return true;
    }

    async _writeMdFile(slug, categorySlug, content) {
        const dir = path.join(this.app.baseDir, 'content/articles', categorySlug || 'uncategorized');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, `${slug}.md`), content, 'utf-8');
    }

    _flatCategories(categories) {
        const result = [];
        for (const c of categories) {
            result.push(c);
            if (c.subCategories) result.push(...c.subCategories);
        }
        return result;
    }

    // ==================== 分类管理 ====================

    async createCategory({ name, slug, description, parentId }) {
        const data = await this.readCategoriesData();
        const id = this.generateId();
        const newCat = { id, name, slug: slug || this.generateSlug(name), description: description || '', parentId: parentId || null };

        if (parentId) {
            const parent = data.categories.find(c => c.id == parentId);
            if (parent) {
                parent.subCategories = parent.subCategories || [];
                parent.subCategories.push({ ...newCat, parentId });
                parent.hasSubMenu = true;
            }
        } else {
            data.categories.push({ ...newCat, hasSubMenu: false, subCategories: [] });
        }

        await this.writeCategoriesData(data);
        return newCat;
    }

    async updateCategory(id, fields) {
        const data = await this.readCategoriesData();
        const allCats = this._flatCategories(data.categories);
        const cat = allCats.find(c => c.id == id);
        if (!cat) return null;
        Object.assign(cat, fields);
        await this.writeCategoriesData(data);
        return cat;
    }

    async deleteCategory(id) {
        const { articles } = await this.readArticlesData();
        const inUse = articles.some(a => a.categoryId == id || (a.categorySlugs || []).includes(String(id)));
        if (inUse) return { ok: false, reason: '该分类下还有文章，无法删除' };

        const data = await this.readCategoriesData();
        // 顶级分类
        const topIdx = data.categories.findIndex(c => c.id == id);
        if (topIdx !== -1) {
            data.categories.splice(topIdx, 1);
            await this.writeCategoriesData(data);
            return { ok: true };
        }
        // 子分类
        for (const parent of data.categories) {
            const sub = parent.subCategories || [];
            const subIdx = sub.findIndex(c => c.id == id);
            if (subIdx !== -1) {
                sub.splice(subIdx, 1);
                parent.hasSubMenu = sub.length > 0;
                await this.writeCategoriesData(data);
                return { ok: true };
            }
        }
        return { ok: false, reason: '分类不存在' };
    }

    // ==================== 图片管理 ====================

    async saveUploadedImage(file) {
        await fs.mkdir(this.imagesDir, { recursive: true });

        const ext = path.extname(file.filename).toLowerCase() || '.jpg';
        const hash = crypto.randomBytes(4).toString('hex');
        const filename = `upload-${Date.now()}-${hash}${ext}`;
        const destPath = path.join(this.imagesDir, filename);

        await fs.copyFile(file.filepath, destPath);
        try { await fs.unlink(file.filepath); } catch {}

        // 记录 meta
        const meta = await this.readImageMeta();
        meta[filename] = {
            uploadedAt: new Date().toISOString(),
            originalName: file.filename,
            size: file._fileSize || 0,
            source: 'editor-upload',
        };
        await this.writeImageMeta(meta);

        return {
            filename,
            url: `/content/assets/images/${filename}`,
        };
    }

    async getImageList() {
        await fs.mkdir(this.imagesDir, { recursive: true });

        const files = (await fs.readdir(this.imagesDir))
            .filter(f => f !== 'meta.json' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));

        const meta = await this.readImageMeta();
        const { articles } = await this.readArticlesData();

        // 建立图片 → 文章引用映射
        const refMap = {};
        for (const a of articles) {
            const matches = (a.content || '').matchAll(/!\[.*?\]\(.*?\/images\/([^)]+)\)/g);
            for (const m of matches) {
                const fname = m[1];
                if (!refMap[fname]) refMap[fname] = [];
                refMap[fname].push({ id: a.id, title: a.title });
            }
            // 封面图
            if (a.coverImage) {
                const coverName = path.basename(a.coverImage);
                if (!refMap[coverName]) refMap[coverName] = [];
                if (!refMap[coverName].find(r => r.id === a.id)) {
                    refMap[coverName].push({ id: a.id, title: a.title, isCover: true });
                }
            }
        }

        const ORPHAN_EXPIRE_DAYS = 7;
        const now = Date.now();

        const result = await Promise.all(files.map(async filename => {
            const fullPath = path.join(this.imagesDir, filename);
            let size = 0;
            try {
                const stat = await fs.stat(fullPath);
                size = stat.size;
            } catch {}

            const fileMeta = meta[filename] || {};
            const uploadedAt = fileMeta.uploadedAt || null;
            const refs = refMap[filename] || [];
            const isOrphan = refs.length === 0;

            let autoDeleteAt = null;
            let daysLeft = null;
            if (isOrphan && uploadedAt) {
                const expireTime = new Date(uploadedAt).getTime() + ORPHAN_EXPIRE_DAYS * 86400000;
                autoDeleteAt = new Date(expireTime).toISOString();
                daysLeft = Math.max(0, Math.ceil((expireTime - now) / 86400000));
            }

            return {
                filename,
                url: `/content/assets/images/${filename}`,
                size,
                uploadedAt,
                originalName: fileMeta.originalName || filename,
                isOrphan,
                refs,           // 引用此图片的文章列表
                autoDeleteAt,
                daysLeft,
            };
        }));

        return result.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
    }

    async deleteImage(filename) {
        const fullPath = path.join(this.imagesDir, filename);
        try { await fs.unlink(fullPath); } catch { return false; }

        const meta = await this.readImageMeta();
        delete meta[filename];
        await this.writeImageMeta(meta);
        return true;
    }

    async cleanupOrphanImages() {
        const images = await this.getImageList();
        const expired = images.filter(img => img.isOrphan && img.daysLeft !== null && img.daysLeft <= 0);

        const deleted = [];
        for (const img of expired) {
            const ok = await this.deleteImage(img.filename);
            if (ok) deleted.push(img.filename);
        }
        return deleted;
    }

    // ==================== Dashboard ====================

    async getDashboardStats() {
        const { articles } = await this.readArticlesData();
        const { categories } = await this.readCategoriesData();
        const images = await this.getImageList();

        const published = articles.filter(a => a.status === 'published');
        const drafts = articles.filter(a => a.status === 'draft');
        const orphans = images.filter(i => i.isOrphan);

        const recent = [...articles]
            .sort((a, b) => new Date(b.updateDate || b.publishDate) - new Date(a.updateDate || a.publishDate))
            .slice(0, 5)
            .map(a => ({ id: a.id, title: a.title, status: a.status, updateDate: a.updateDate || a.publishDate }));

        const allCats = this._flatCategories(categories);

        return {
            totalArticles: articles.length,
            publishedArticles: published.length,
            draftArticles: drafts.length,
            totalCategories: allCats.length,
            totalImages: images.length,
            orphanImages: orphans.length,
            recentArticles: recent,
        };
    }
}

module.exports = AdminService;
