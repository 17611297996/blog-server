/* eslint valid-jsdoc: "off" */
const path = require('path');

module.exports = appInfo => {
  const config = exports = {};

  config.keys = appInfo.name + '_1753019796624_141';
  config.middleware = [];

  // CORS
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    credentials: true,
  };

  // 静态文件---
  config.static = {
    prefix: '/public/',
    dir: [
      path.join(appInfo.baseDir, 'app/public'),
      { prefix: '/content/', dir: path.join(appInfo.baseDir, 'content') },
    ],
    dynamic: true,
    preload: false,
    maxAge: 31536000,
    buffer: true,
    gzip: true,
  };

  // 图片上传
  config.multipart = {
    mode: 'file',
    fileSize: '10mb',
    whitelist: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    tmpdir: path.join(appInfo.baseDir, 'content/assets/tmp'),
    cleanSchedule: { cron: '0 30 4 * * *' },
  };

  // 关闭 csrf（前后端分离）
  config.security = {
    csrf: { enable: false },
  };

  // admin 配置（密码 + token 过期时间）
  const userConfig = {
    admin: {
      password: 'admin123',   // 上线前改掉
      tokenExpire: 86400000,  // 24小时，ms
    },
  };

  return { ...config, ...userConfig };
};
