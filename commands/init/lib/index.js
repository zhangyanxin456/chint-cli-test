'use strict';

const log = require('@chint-cli-test/log');
function init() {
  log.info('init -1哈哈哈')
  return 'Hello from init';
}
module.exports = init;
