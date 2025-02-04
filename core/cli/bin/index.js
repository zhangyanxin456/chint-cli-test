#!/usr/bin/env node

"use strict";


const path = require("path");
const colors = require("colors/safe");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const commander = require("commander");
const log = require("@chint-cli-test/log");
const init = require('@chint-cli-test/init');
const pkg = require("../package.json");
const program = new commander.Command();

const LOWEST_NODE_VERSION = '18.0.0';
const DEFAULT_CLI_HOME = '.chint-cli-test';
async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
    if (program.debug) {
      console.log(e);
    }
  }
}
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false);

  program
    .command("init [type]")
    .description("项目初始化")
    .option("--packagePath <packagePath>", "手动指定init包路径")
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')
    .option("--force", "覆盖当前路径文件（谨慎使用）")
    .action(() => init({}));
  program
    .command("add [templateName]")
    .option("-f, --force", "是否强制添加代码");

  program
    .command("publish")
    .option("--refreshServer", "强制更新远程Git仓库")
    .option("--refreshToken", "强制更新远程仓库token")
    .option("--refreshOwner", "强制更新远程仓库类型")
    .option("--buildCmd <buildCmd>", "构建命令")
    .option("--prod", "是否正式发布")
    .option("--sshUser <sshUser>", "模板服务器用户名")
    .option("--sshIp <sshIp>", "模板服务器IP或域名")
    .option("--sshPath <sshPath>", "模板服务器上传路径");

  // 开启debug模式
  program.on("option:debug", function () {
    if (program.debug) {
      process.env.LOG_LEVEL = "verbose";
    } else {
      process.env.LOG_LEVEL = "info";
    }
    log.level = process.env.LOG_LEVEL;
  });

  //未知命令监听
  program.on("command:*", function () {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    if (availableCommands.length > 0) {
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

async function prepare() {
  checkPkgVersion(); // 检查当前运行版本
  checkNodeVersion(); // 检查node版本
  checkRoot(); // 检查是否为 root 启动
  checkUserHome(); // 检查用户主目录
  checkEnv(); // 检查环境变量
}

function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, DEFAULT_CLI_HOME);
  }
  return cliConfig;
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"));
  }
}

function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
}

function checkPkgVersion() {
  log.info("cli", pkg.version);
}
function checkNodeVersion() {
  const semver = require("semver");
  if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(
        `chint-cli-test 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`
      )
    );
  }
}

process.on("unhandledRejection", (reason, p) => {
  // 我刚刚捕获了一个未处理的promise rejection
  throw reason;
});

process.on("uncaughtException", (error) => {
  // 我刚收到一个从未被处理的错误，现在处理它，并决定是否需要重启应用
  console.log("uncaughtException", error);
  process.exit(1);
});


core()
