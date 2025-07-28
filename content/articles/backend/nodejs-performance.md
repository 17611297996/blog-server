# Node.js 性能优化实战

> 发布时间：2024-01-08  
> 分类：后端开发 > Node.js  
> 标签：Node.js, 性能优化, 后端开发

## 引言

Node.js 作为高性能的服务器端 JavaScript 运行时，在正确使用的情况下能够提供出色的性能。但是，如果不注意一些关键的优化点，应用的性能可能会大打折扣。本文将分享一些实用的 Node.js 性能优化技巧。

## 性能监控

在开始优化之前，我们需要建立性能监控体系：

### 1. 使用 Performance Hooks

```javascript
const { performance, PerformanceObserver } = require('perf_hooks')

const observer = new PerformanceObserver(list => {
    const entries = list.getEntries()
    entries.forEach(entry => {
        console.log(`${entry.name}: ${entry.duration}ms`)
    })
})

observer.observe({ entryTypes: ['measure'] })

// 测量代码执行时间
performance.mark('start-operation')
// ... 执行一些操作
performance.mark('end-operation')
performance.measure('operation-duration', 'start-operation', 'end-operation')
```

### 2. 内存使用监控

```javascript
// 监控内存使用情况
setInterval(() => {
    const memUsage = process.memoryUsage()
    console.log({
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    })
}, 10000)
```

## 异步操作优化

### 1. 避免阻塞事件循环

```javascript
// ❌ 错误：同步操作阻塞事件循环
const fs = require('fs')
const data = fs.readFileSync('large-file.txt')

// ✅ 正确：使用异步操作
const fs = require('fs').promises
const data = await fs.readFile('large-file.txt')

// ✅ 更好：使用流处理大文件
const fs = require('fs')
const stream = fs.createReadStream('large-file.txt')
```

### 2. 并发控制

```javascript
const pLimit = require('p-limit')

// 限制并发数量，避免资源耗尽
const limit = pLimit(5)

const urls = ['url1', 'url2', 'url3' /* ... 更多URL */]

const promises = urls.map(url => limit(() => fetch(url)))

const results = await Promise.all(promises)
```

## 内存管理优化

### 1. 对象池化

```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn
        this.resetFn = resetFn
        this.pool = []

        // 预先创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn())
        }
    }

    acquire() {
        return this.pool.length > 0 ? this.pool.pop() : this.createFn()
    }

    release(obj) {
        this.resetFn(obj)
        this.pool.push(obj)
    }
}

// 使用示例
const bufferPool = new ObjectPool(
    () => Buffer.alloc(1024),
    buffer => buffer.fill(0),
    50
)
```

### 2. 避免内存泄漏

```javascript
// ❌ 内存泄漏：未清理的定时器
const timer = setInterval(() => {
    // 一些操作
}, 1000)

// ✅ 正确：适时清理
process.on('SIGTERM', () => {
    clearInterval(timer)
})

// ❌ 内存泄漏：未移除的事件监听器
const EventEmitter = require('events')
const emitter = new EventEmitter()

function handleEvent(data) {
    // 处理事件
}

emitter.on('data', handleEvent)

// ✅ 正确：移除监听器
process.on('exit', () => {
    emitter.removeListener('data', handleEvent)
})
```

## 数据库优化

### 1. 连接池管理

```javascript
const mysql = require('mysql2')

// 创建连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test',
    connectionLimit: 10, // 限制连接数
    queueLimit: 0, // 队列限制
    acquireTimeout: 60000, // 获取连接超时
    timeout: 60000, // 查询超时
    reconnect: true // 自动重连
})

// 使用连接池
const promisePool = pool.promise()

async function getUser(id) {
    const [rows] = await promisePool.execute('SELECT * FROM users WHERE id = ?', [id])
    return rows[0]
}
```

### 2. 查询优化

```javascript
// ❌ N+1 查询问题
async function getBooksWithAuthors() {
    const books = await Book.findAll()
    for (const book of books) {
        book.author = await Author.findById(book.authorId)
    }
    return books
}

// ✅ 使用 JOIN 或批量查询
async function getBooksWithAuthors() {
    return await Book.findAll({
        include: [
            {
                model: Author,
                as: 'author'
            }
        ]
    })
}
```

## 缓存策略

### 1. 内存缓存

```javascript
const LRU = require('lru-cache')

const cache = new LRU({
    max: 1000, // 最大缓存项数
    maxAge: 1000 * 60 * 10 // 10分钟过期
})

async function getDataWithCache(key) {
    // 先查缓存
    let data = cache.get(key)
    if (data) {
        return data
    }

    // 缓存未命中，从数据库获取
    data = await database.getData(key)
    cache.set(key, data)

    return data
}
```

### 2. Redis 缓存

```javascript
const redis = require('redis')
const client = redis.createClient()

async function getDataWithRedis(key) {
    try {
        // 尝试从 Redis 获取
        const cachedData = await client.get(key)
        if (cachedData) {
            return JSON.parse(cachedData)
        }

        // 从数据库获取
        const data = await database.getData(key)

        // 缓存到 Redis（5分钟过期）
        await client.setex(key, 300, JSON.stringify(data))

        return data
    } catch (error) {
        console.error('Redis error:', error)
        return await database.getData(key)
    }
}
```

## HTTP 请求优化

### 1. Keep-Alive 连接

```javascript
const http = require('http')

const agent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 50,
    maxFreeSockets: 10
})

// 使用持久连接
const options = {
    hostname: 'api.example.com',
    port: 80,
    path: '/data',
    agent: agent
}
```

### 2. 响应压缩

```javascript
const express = require('express')
const compression = require('compression')

const app = express()

// 启用 gzip 压缩
app.use(
    compression({
        level: 6, // 压缩级别 (1-9)
        threshold: 1024, // 大于1KB才压缩
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false
            }
            return compression.filter(req, res)
        }
    })
)
```

## 集群模式

```javascript
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 正在运行`)

    // 为每个 CPU 核心创建工作进程
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`工作进程 ${worker.process.pid} 已退出`)
        cluster.fork() // 重新创建工作进程
    })
} else {
    // 工作进程
    require('./app.js')
    console.log(`工作进程 ${process.pid} 已启动`)
}
```

## 性能测试

### 1. 压力测试

```bash
# 使用 ab 进行压力测试
ab -n 1000 -c 10 http://localhost:3000/api/users

# 使用 wrk 进行更复杂的测试
wrk -t12 -c400 -d30s http://localhost:3000/api/users
```

### 2. 性能分析

```javascript
// 使用 clinic.js 进行性能分析
// 安装：npm install -g clinic
// 使用：clinic doctor -- node app.js

// 或使用内置的 profiler
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

## 最佳实践总结

1. **监控优先**: 建立完善的性能监控体系
2. **异步优化**: 避免阻塞操作，合理使用异步编程
3. **内存管理**: 及时释放资源，避免内存泄漏
4. **缓存策略**: 合理使用缓存减少计算和 I/O
5. **数据库优化**: 使用连接池，优化查询
6. **集群部署**: 充分利用多核 CPU
7. **定期分析**: 使用工具定期分析性能瓶颈

通过这些优化策略，可以显著提升 Node.js 应用的性能表现。记住，性能优化是一个持续的过程，需要根据实际情况不断调整和改进。

---

_关注更多 Node.js 后端开发技巧，提升你的服务器端开发能力。_
