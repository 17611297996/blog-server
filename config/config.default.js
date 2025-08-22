/* eslint valid-jsdoc: "off" */

const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1753019796624_141';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  // CORS配置，允许前端跨域访问
  config.cors = {
    origin: '*', // 允许来自http://localhost:3000的跨域请求
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    credentials: true, // 允许携带cookie
  };

  // 静态文件服务配置
  config.static = {
    prefix: '/content/',
    dir: path.join(appInfo.baseDir, 'content'),
    dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件
    preload: false,
    maxAge: 31536000, // 1年缓存
    buffer: true, // 是否缓存文件内容
    // 支持图片等媒体文件
    gzip: true,
  };

  // 另外为app/public目录配置静态服务
  config.assets = {
    '/public': path.join(appInfo.baseDir, 'app/public'),
  };

  return {
    ...config,
    ...userConfig,
  };
};
