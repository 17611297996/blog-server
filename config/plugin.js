/** @type Egg.EggPlugin */
module.exports = {
  static: {
    enable: true,
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  multipart: {
    enable: true,
    package: 'egg-multipart',
  },
};
