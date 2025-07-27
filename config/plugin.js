/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }

  // 启用CORS插件，解决前端跨域访问问题
  cors: {
    enable: true,
    package: 'egg-cors',
  },
};
