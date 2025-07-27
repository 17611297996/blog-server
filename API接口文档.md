# 博客系统 API 文档

## 📋 概述

本文档描述了博客系统的所有 RESTful API 接口，包括文章、分类、标签和用户相关的功能。
备用接口留了很多，方便以后增加功能

### 主要用到接口:

-   `GET /api/articles` - 获取文章列表
-   `GET /api/articles/search` -
-   `GET /api/articles/featured` - 获取推荐文章
-   `GET /api/articles/:id` - 根据 ID 获取文章详情
-   `GET /api/articles/category/:categorySlug` - 按分类获取文章

    **Base URL**: `http://localhost:7001`  
    **Content-Type**: `application/json`

## 🔗 API 路由总览

### 文章接口 (Articles)

-   `GET /api/articles` - 获取文章列表
-   `GET /api/articles/search` - 搜索文章
-   `GET /api/articles/popular` - 获取热门文章
-   `GET /api/articles/featured` - 获取推荐文章
-   `GET /api/articles/latest` - 获取最新文章
-   `GET /api/articles/slug/:slug` - 根据 slug 获取文章详情
-   `GET /api/articles/category/:categorySlug` - 按分类获取文章
-   `GET /api/articles/tag/:tagSlug` - 按标签获取文章
-   `GET /api/articles/:id` - 根据 ID 获取文章详情

### 分类接口 (Categories)

-   `GET /api/categories` - 获取所有分类
-   `GET /api/categories/tree` - 获取分类树结构
-   `GET /api/categories/stats` - 获取分类统计信息
-   `GET /api/categories/main` - 获取主分类列表
-   `GET /api/categories/slug/:slug` - 根据 slug 获取分类详情
-   `GET /api/categories/:id` - 根据 ID 获取分类详情
-   `GET /api/categories/:id/children` - 获取子分类列表

### 标签接口 (Tags)

-   `GET /api/tags` - 获取所有标签
-   `GET /api/tags/popular` - 获取热门标签
-   `GET /api/tags/cloud` - 获取标签云数据
-   `GET /api/tags/search` - 搜索标签
-   `GET /api/tags/stats` - 获取标签统计信息
-   `GET /api/tags/slug/:slug` - 根据 slug 获取标签详情
-   `GET /api/tags/:slug/related` - 获取相关标签
-   `GET /api/tags/:id` - 根据 ID 获取标签详情

### 用户接口 (Users)

-   `GET /api/users/authors` - 获取所有作者列表
-   `GET /api/users/username/:username` - 根据用户名获取用户信息
-   `GET /api/users/author/:identifier` - 获取作者信息
-   `GET /api/users/:id/stats` - 获取用户文章统计
-   `GET /api/users/:id` - 根据 ID 获取用户信息

---

## 📝 文章接口 (Articles)

### 1. 获取文章列表

**接口**: `GET /api/articles`

**查询参数**:

-   `page` (number): 页码，默认 1
-   `pageSize` (number): 每页数量，默认 10
-   `category` (string): 分类筛选
-   `tag` (string): 标签筛选
-   `search` (string): 搜索关键词
-   `status` (string): 文章状态，默认 'published'

**响应示例**:

```json
{
    "success": true,
    "code": 200,
    "message": "获取文章列表成功",
    "data": {
        "articles": [
            {
                "id": 3229293222,
                "title": "React Hooks 完全指南",
                "slug": "react-hooks-guide",
                "excerpt": "React Hooks 是 React 16.8 引入的新特性...",
                "categoryId": 1,
                "categorySlug": "frontend",
                "tags": ["React", "Hooks", "前端开发"],
                "author": "admin",
                "publishDate": "2024-01-20T00:00:00.000Z",
                "updateDate": "2025-07-20T14:48:54.274Z",
                "status": "published",
                "views": 0,
                "likes": 0,
                "featured": false,
                "coverImage": "content/assets/images/react-hooks-guide-cover.jpg"
            }
        ],
        "pagination": {
            "current": 1,
            "pageSize": 10,
            "total": 3,
            "totalPages": 1,
            "hasNext": false,
            "hasPrev": false
        }
    }
}
```

### 2. 获取文章详情

**接口**: `GET /api/articles/:id` 或 `GET /api/articles/slug/:slug`

**响应示例**:

```json
{
    "success": true,
    "code": 200,
    "message": "获取文章详情成功",
    "data": {
        "id": 3229293222,
        "title": "React Hooks 完全指南",
        "slug": "react-hooks-guide",
        "content": "# React Hooks 完全指南\n\n## 简介\n...",
        "author": {
            "id": 1,
            "username": "admin",
            "displayName": "管理员",
            "avatar": "avatar.jpg",
            "stats": {
                "totalArticles": 3,
                "publishedArticles": 3
            }
        },
        "category": {
            "id": 1,
            "name": "前端开发",
            "slug": "frontend"
        },
        "tags": ["React", "Hooks", "前端开发"],
        "publishDate": "2024-01-20T00:00:00.000Z",
        "views": 0,
        "likes": 0
    }
}
```

### 3. 搜索文章

**接口**: `GET /api/articles/search`

**说明**: 仅搜索文章标题，不包含摘要和标签

**查询参数**:

-   `q` (string): 搜索关键词 (必填)
-   `page` (number): 页码，默认 1
-   `pageSize` (number): 每页数量，默认 10

### 4. 按分类获取文章

**接口**: `GET /api/articles/category/:categorySlug`

**查询参数**:

-   `page` (number): 页码，默认 1
-   `pageSize` (number): 每页数量，默认 10

### 5. 按标签获取文章

**接口**: `GET /api/articles/tag/:tagSlug`

**查询参数**:

-   `page` (number): 页码，默认 1
-   `pageSize` (number): 每页数量，默认 10

### 6. 获取热门/推荐/最新文章

**接口**:

-   `GET /api/articles/popular` - 热门文章
-   `GET /api/articles/featured` - 推荐文章
-   `GET /api/articles/latest` - 最新文章

**查询参数**:

-   `limit` (number): 返回数量，默认 5

---

## 🗂 分类接口 (Categories)

### 1. 获取分类树结构

**接口**: `GET /api/categories/tree`

**用途**: 用于前端导航菜单

**响应示例**:

```json
{
    "success": true,
    "code": 200,
    "message": "获取分类树成功",
    "data": [
        {
            "id": 1,
            "name": "前端开发",
            "slug": "frontend",
            "description": "前端开发相关技术文章",
            "hasSubMenu": true,
            "subCategories": [
                {
                    "id": 11,
                    "name": "Vue.js",
                    "slug": "vue",
                    "description": "Vue.js 相关文章"
                },
                {
                    "id": 12,
                    "name": "React",
                    "slug": "react",
                    "description": "React 相关文章"
                }
            ]
        }
    ]
}
```

### 2. 获取分类统计信息

**接口**: `GET /api/categories/stats`

**响应示例**:

```json
{
    "success": true,
    "code": 200,
    "message": "获取分类统计成功",
    "data": [
        {
            "id": 1,
            "name": "前端开发",
            "slug": "frontend",
            "articleCount": 2,
            "latestArticle": {
                "id": 3229293222,
                "title": "React Hooks 完全指南",
                "publishDate": "2024-01-20T00:00:00.000Z"
            }
        }
    ]
}
```

---

## 🏷 标签接口 (Tags)

### 1. 获取标签云数据

**接口**: `GET /api/tags/cloud`

**响应示例**:

```json
{
    "success": true,
    "code": 200,
    "message": "获取标签云成功",
    "data": [
        {
            "id": 1,
            "name": "React",
            "slug": "react",
            "count": 2,
            "color": "#61dafb",
            "weight": 1.5
        },
        {
            "id": 2,
            "name": "Vue.js",
            "slug": "vue",
            "count": 1,
            "color": "#4fc08d",
            "weight": 1.0
        }
    ]
}
```

### 2. 获取热门标签

**接口**: `GET /api/tags/popular`

**查询参数**:

-   `limit` (number): 返回数量，默认 10

### 3. 搜索标签

**接口**: `GET /api/tags/search`

**查询参数**:

-   `q` (string): 搜索关键词 (必填)

### 4. 获取相关标签

**接口**: `GET /api/tags/:slug/related`

**查询参数**:

-   `limit` (number): 返回数量，默认 5

---

## 👤 用户接口 (Users)

### 1. 获取作者信息

**接口**: `GET /api/users/author/:identifier`

**参数**: identifier 可以是用户名或用户 ID

**响应示例**:

```json
{
    "success": true,
    "code": 200,
    "message": "获取作者信息成功",
    "data": {
        "id": 1,
        "username": "admin",
        "displayName": "管理员",
        "avatar": "avatar.jpg",
        "bio": "技术博客作者",
        "stats": {
            "totalArticles": 3,
            "publishedArticles": 3,
            "draftArticles": 0,
            "totalViews": 150,
            "totalLikes": 25,
            "latestArticle": {
                "id": 3229293222,
                "title": "React Hooks 完全指南"
            }
        }
    }
}
```

### 2. 获取所有作者列表

**接口**: `GET /api/users/authors`

**响应**: 返回所有有文章的作者列表，按文章数量排序

---

## 📊 响应格式

### 成功响应

```json
{
    "success": true,
    "code": 200,
    "message": "操作成功",
    "data": {}
}
```

### 错误响应

```json
{
    "success": false,
    "code": 404,
    "message": "资源不存在"
}
```

```json
{
    "success": false,
    "code": 500,
    "message": "服务器内部错误",
    "error": "详细错误信息"
}
```

---

## 🚀 使用示例

### 前端导航菜单

```javascript
// 获取分类树用于导航
const response = await fetch('/api/categories/tree')
const { data: categories } = await response.json()
```

### 文章列表页

```javascript
// 获取分页文章列表
const response = await fetch('/api/articles?page=1&pageSize=10&category=frontend')
const { data } = await response.json()
const { articles, pagination } = data
```

### 文章详情页

```javascript
// 获取文章详情
const response = await fetch('/api/articles/slug/react-hooks-guide')
const { data: article } = await response.json()
```

### 搜索功能

```javascript
// 搜索文章（仅搜索标题）
const response = await fetch('/api/articles/search?q=React&page=1')
const { data } = await response.json()
```

---

## 📝 注意事项

1. **路由顺序**: 具体路由需要放在通用路由之前，避免冲突
2. **错误处理**: 所有接口都包含统一的错误处理
3. **分页**: 文章列表相关接口都支持分页
4. **缓存**: 建议对分类、标签等相对稳定的数据进行缓存
5. **性能**: 大文件内容读取会影响性能，建议合理使用

## 🔄 状态码说明

-   `200` - 请求成功
-   `400` - 请求参数错误
-   `404` - 资源不存在
-   `500` - 服务器内部错误
