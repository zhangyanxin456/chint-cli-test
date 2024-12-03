'use strict';
const path = require('path');
const Package = require('@chint-cli-test/package');
const log = require('@chint-cli-test/log');

const CACHE_DIR = 'dependencies';
let pkg;

async function exec(str, options) {
  let targetPath =  options.targetPath;
  const homePath = process.env.CLI_HOME;
  const storeDir = path.resolve(targetPath, 'node_modules');
  const packageVersion = 'latest';
  console.log('targetPath', targetPath, 161661, arguments[arguments.length - 1]);
  // const cmdObj = arguments[arguments.length - 1];
  // const cmdName = cmdObj.name();
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
    pkg = new Package({
      targetPath,
      storeDir,
      packageName: str || '',
      packageVersion,
    });
    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName: str || '',
      packageVersion
    });
  }
}
module.exports = exec;
 