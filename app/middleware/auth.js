// admin 接口鉴权中间件
// token = 过期时间.HMAC签名，不存服务端：多进程（egg-scripts 默认按 CPU 核数起多个 worker）和重启后都能校验；
// 签名密钥含后台密码，改密码后旧 token 全部失效
const crypto = require('crypto');

const sign = (app, expireAt) =>
    crypto.createHmac('sha256', `${app.config.keys}:${app.config.admin.password}`).update(String(expireAt)).digest('hex');

const verify = (app, token) => {
    const [expireAt, signature] = String(token).split('.');
    if (!/^\d+$/.test(expireAt) || !signature || Date.now() > Number(expireAt)) return false;
    const expected = Buffer.from(sign(app, expireAt));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

// router.js 里直接调用 middleware.auth()，不会传入 app，所以从 ctx.app 取
module.exports = () => {
    return async (ctx, next) => {
        const token = ctx.get('x-admin-token');
        if (!token || !verify(ctx.app, token)) {
            ctx.status = 401;
            ctx.body = { success: false, code: 401, message: token ? 'token 已过期，请重新登录' : '未登录' };
            return;
        }
        await next();
    };
};

// 供 login 接口调用
module.exports.createToken = app => {
    const expireAt = Date.now() + app.config.admin.tokenExpire;
    return `${expireAt}.${sign(app, expireAt)}`;
};
