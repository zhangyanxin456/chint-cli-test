'use strict';
const path = require('path');
const Package = require('@chint-cli-test/package');
const log = require('@chint-cli-test/log');

const CACHE_DIR = 'dependencies';
let pkg;
function spawn(command, args, options) {
  const win32 = process.platform === 'win32';

  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return require('child_process').spawn(cmd, cmdArgs, options || {});
}
async function exec(str, options) {
  console.log('exec, 101010', str, options)
  let targetPath =  options.targetPath;
  const homePath = process.env.CLI_HOME;
  const storeDir = path.resolve(targetPath, 'node_modules');
  const packageVersion = 'latest';
  const packageName = options.packageName;
  // const cmdObj = arguments[arguments.length - 1];
  // const cmdName = cmdObj.name();
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
    console.log(262626,targetPath)
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
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
      packageName,
      packageVersion
    });
  }

  const rootFile = pkg.getRootFilePath();
  console.log('rootFile494949', rootFile);

  if (rootFile) {
    try {
      // 在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments));
      // 在node子进程中调用
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent') {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
      child.on('error', e => {
        log.error(e.message);
        process.exit(1);
      });
      child.on('exit', e => {
        log.verbose('命令执行成功:' + e);
        process.exit(e);
      });
    } catch (e) {
      log.error(e.message);
    }
  }
}
module.exports = exec;
 