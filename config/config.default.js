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
    origin: '*', // 开发环境允许所有来源
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  // 静态文件服务配置
  config.static = {
    prefix: '/content/',
    dir: [
      { prefix: '/content', dir: path.join(appInfo.baseDir, 'content') },
      { prefix: '/public', dir: path.join(appInfo.baseDir, 'app/public') },
    ],
    dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件
    preload: false,
    maxAge: 31536000, // 1年缓存
    buffer: true, // 是否缓存文件内容
  };

  return {
    ...config,
    ...userConfig,
  };
};
