// admin 接口鉴权中间件
// token 存在内存 Map 里，重启失效（单人博客够用）
const tokens = new Map(); // token -> expireAt

module.exports = (options, app) => {
    return async (ctx, next) => {
        const token = ctx.get('x-admin-token');
        if (!token) {
            ctx.status = 401;
            ctx.body = { success: false, code: 401, message: '未登录' };
            return;
        }
        const expireAt = tokens.get(token);
        if (!expireAt || Date.now() > expireAt) {
            tokens.delete(token);
            ctx.status = 401;
            ctx.body = { success: false, code: 401, message: 'token 已过期，请重新登录' };
            return;
        }
        await next();
    };
};

// 供 login 接口调用
module.exports.createToken = (expire) => {
    const token = require('crypto').randomBytes(24).toString('hex');
    tokens.set(token, Date.now() + expire);
    return token;
};
