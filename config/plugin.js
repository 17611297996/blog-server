/** @type Egg.EggPlugin */
module.exports = {
  // 启用静态文件服务，用于图片等资源访问
  static: {
    enable: true,
  },

  // 启用CORS插件，解决前端跨域访问问题
  cors: {
    enable: true,
    package: 'egg-cors',
  },
};
