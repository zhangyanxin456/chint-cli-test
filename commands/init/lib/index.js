'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const log = require('@chint-cli-test/log');
const inquirer = require('inquirer')
const path = require('path');
const {glob} = require('glob');
const ejs = require('ejs');
const get = require('lodash/get');
const simpleGit = require('simple-git');
const COMPONENT_FILE = '.componentrc';
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const Spinner = require('cli-spinner').Spinner
const templateList = [
  {
    name: 'vue3',
    // gitlab 仓库
    gitPath: 'http://gitlab.chintanneng.com/front_end/vue3-basic-project.git'
  },
  {
    name: 'react',
    gitPath: 'react'
  }
]
const DEFAULT_TYPE = TYPE_PROJECT;



async function ejsFunc(dir, options = {}, extraOptions = {}, diableFormatDotFile = false) {
  const ignore = get(extraOptions, 'ignore');
  return new Promise((resolve, reject) => {
    glob('**', {
      cwd: dir,
      nodir: true,
      ignore: ignore || '**/node_modules/**',
    }, (err, files) => {
      if (err) {
        return reject(err);
      }
      Promise.all(files.map((file) => {
        const filepath = path.join(dir, file);
        return renderFile(filepath, options, diableFormatDotFile);
      })).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  });
};

function renderFile(filepath, options, diableFormatDotFile) {
  let filename = path.basename(filepath);

  if (filename.indexOf('.png') !== -1 || filename.indexOf('.jpg') !== -1) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    ejs.renderFile(filepath, options, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (/\.ejs$/.test(filepath)) {
        filename = filename.replace(/\.ejs$/, '.html');
        fse.removeSync(filepath);
      }
      const newFilepath = path.join(filepath, '../', filename);
      fse.writeFileSync(newFilepath, result);
      resolve(newFilepath);
    });
  });
}

function inquirerFunc({ choices, defaultValue, message, type = 'list', require = true, mask = '*' }) {
  const options = {
    type,
    name: 'name',
    message,
    default: defaultValue,
    require,
    mask,
  }
  if (type === 'list') {
    options.choices = choices;
  }
  return inquirer.default.prompt(options).then((answer) => answer.name)
}

function spinner(msg, spinnerString = '|/-\\') {
  const spinner = new Spinner(`${msg}.. %s`)
  spinner.setSpinnerString(spinnerString)
  spinner.start()
  return spinner
}

async function init(options) {
  try {
    // 完成项目初始化的准备和校验工作
    const result = await prepare(options);
    if (!result) {
      log.info('创建项目终止');
      return;
    }
    // 获取项目模板列表
    const { project } = result;
    // 缓存项目模板文件
    const template = await downloadTemplate(project);
  } catch (e) {
    if (options.debug) {
      log.error('Error:', e.stack);
    } else {
      log.error('Error:', e.message);
    }
  } finally {
    process.exit(0);
  }
}

async function installCustomTemplate(template, ejsData, options) {
  const pkgPath = path.resolve(template.sourcePath, 'package.json');
  const pkg = fse.readJsonSync(pkgPath);
  const rootFile = path.resolve(template.sourcePath, pkg.main);
  if (!fs.existsSync(rootFile)) {
    throw new Error('入口文件不存在！');
  }
  log.notice('开始执行自定义模板');
  const targetPath = options.targetPath;
  await execCustomTemplate(rootFile, {
    targetPath,
    data: ejsData,
    template,
  });
  log.success('自定义模板执行成功');
}

function camelTrans(str, isBig) {
  let i = isBig ? 0 : 1;
  str = str.split('-');
  return str.join('');
}
function formatName(name) {
  if (name) {
    name = `${name}`.trim();
    if (name) {
      if (/^[.*_\/\\()&^!@#$%+=?<>~`\s]/.test(name)) {
        name = name.replace(/^[.*_\/\\()&^!@#$%+=?<>~`\s]+/g, '');
      }
      if (/^[0-9]+/.test(name)) {
        name = name.replace(/^[0-9]+/, '');
      }
      if (/[.*_\/\\()&^!@#$%+=?<>~`\s]/.test(name)) {
        name = name.replace(/[.*_\/\\()&^!@#$%+=?<>~`\s]/g, '-');
      }
      return camelTrans(name, true);
    } else {
      return name;
    }
  } else {
    return name;
  }
}
function exec(command, args, options) {
  const win32 = process.platform === 'win32';

  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return require('child_process').spawn(cmd, cmdArgs, options || {});
}
function execCustomTemplate(rootFile, options) {
  const code = `require('${rootFile}')(${JSON.stringify(options)})`;
  return new Promise((resolve, reject) => {
    const p = exec('node', ['-e', code], { 'stdio': 'inherit' });
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}

async function npminstall(targetPath) {
  return new Promise((resolve, reject) => {
    const p = exec('npm', ['install', '--registry=https://registry.npmmirror.com'], { stdio: 'inherit', cwd: targetPath });
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}

// 如果是组件项目，则创建组件相关文件
async function createComponentFile(template, data, dir) {
  if (template.tag.includes(TYPE_COMPONENT)) {
    const componentData = {
      ...data,
      buildPath: template.buildPath,
      examplePath: template.examplePath,
      npmName: template.npmName,
      npmVersion: template.version,
    }
    const componentFile = path.resolve(dir, COMPONENT_FILE);
    fs.writeFileSync(componentFile, JSON.stringify(componentData));
  }
}
function sleep(timeout) {
  return new Promise((resolve => {
    setTimeout(resolve, timeout);
  }));
}
async function downloadTemplate(project) {
  // 用户交互选择
  const templateUrl = await inquirerFunc({
    choices: createTemplateChoice(),
    message: '请选择项目模板',
  });
  const projectDir = path.join(process.cwd(), project.name);
  try {
    // 克隆模板仓库到临时目录
    let spinnerStart = spinner(`正在下载模板...`);
    await sleep(1000);
    await simpleGit().clone(templateUrl, projectDir);
    spinnerStart.stop(true);
    log.success('模板下载成功');
    // 删除.git 目录以断开与模板仓库的关联
    await fs.remove(`${projectDir}/.git`);
    // 更新远程仓库 URL（如果需要）
    if (project.gitRepo) {
      const simpleGitInstance = simpleGit(projectDir);
      await simpleGitInstance.addRemote('origin', project.gitRepo); // 或者使用 set-url 如果需要替换现有远程
    }
    // 更新项目信息
    const ejsIgnoreFiles = [
      '**/node_modules/**',
      '**/.git/**',
      '**/.vscode/**',
      '**/.DS_Store',
    ];
    await ejsFunc(projectDir, project, {
      ignore: ejsIgnoreFiles,
    });
    // 安装依赖文件
    log.notice('开始安装依赖');
    await npminstall(projectDir);
    log.success('依赖安装成功');
  } catch(error) {
    log.error(error)
  }
}

async function prepare(options) {
  let fileList = fs.readdirSync(process.cwd());
  fileList = fileList.filter(file => ['node_modules', '.git', '.DS_Store'].indexOf(file) < 0);
  let continueWhenDirNotEmpty = true;
  if (fileList && fileList.length > 0) {
    continueWhenDirNotEmpty = await inquirerFunc({
      type: 'confirm',
      message: '当前文件夹不为空，是否继续创建项目？',
      defaultValue: false,
    });
  }
  if (!continueWhenDirNotEmpty) {
    return;
  }
  if (options.force) {
    const targetDir = options.targetPath;
    const confirmEmptyDir = await inquirerFunc({
      type: 'confirm',
      message: '是否确认清空当下目录下的文件',
      defaultValue: false,
    }); 
    if (confirmEmptyDir) {
      fse.emptyDirSync(targetDir);
    }
  }
  let initType = await getInitType();
  let projectName = '';
  let className = '';
  while (!projectName) {
    projectName = await getProjectName(initType);
  }
  let version = '1.0.0';
  do {
    version = await getProjectVersion(version, initType);
    log.info('version', version);
  } while (!version);
  let appCode = '';
  do {
    appCode = await getappCode();
  } while (!appCode);
  let gitRepo = await getGitRepo();
  if (initType === TYPE_PROJECT) {
    return {
      project: {
        name: projectName,
        className,
        version,
        gitRepo,
        appCode,
      },
    };
  } else {
    let description = '';
    while (!description) {
      description = await getComponentDescription();
    }
    return {
      project: {
        name: projectName,
        className,
        version,
        description,
        // pointSysCode
        gitRepo,
        appCode
      },
    };
  }
}

function getComponentDescription() {
  return inquirerFunc({
    type: 'string',
    message: '请输入组件的描述信息',
    defaultValue: '',
  });
}

function getProjectVersion(defaultVersion, initType) {
  return inquirerFunc({
    type: 'string',
    message: initType === TYPE_PROJECT ? '请输入项目版本号' : '请输入组件版本号',
    defaultValue: defaultVersion,
  });
}
function getappCode() {
  return inquirerFunc({
    type: 'string',
    message: '请输入appCode',
    defaultValue: '',
  });
}
function getGitRepo() {
  return inquirerFunc({
    type: 'string',
    message: '请输入git仓库地址',
    defaultValue: '',
  });
}
function getProjectBurialPointInfo() {
  return inquirerFunc({
    type: 'list',
    choices: [{
      name: '是',
      value: 'Y',
    }, {
      name: '否',
      value: 'N',
    }],
    message: '请选择是否需要埋点',
    defaultValue: 'Y',
  });
}
function getProjectName(initType) {
  return inquirerFunc({
    type: 'string',
    message: initType === TYPE_PROJECT ? '请输入项目名称' : '请输入组件名称',
    defaultValue: '',
  });
}
function getProjectBurialPointSysCode() {
  return inquirerFunc({
    type: 'string',
    message: '请输入埋点code',
    defaultValue: '',
  });
}
function getInitType() {
  return inquirerFunc({
    type: 'list',
    choices: [{
      name: '项目',
      value: TYPE_PROJECT,
    }, {
      name: '组件',
      value: TYPE_COMPONENT,
    }],
    message: '请选择初始化类型',
    defaultValue: DEFAULT_TYPE,
  });
}



function createTemplateChoice() {
  
  return templateList.map(item => ({
    value: item.gitPath,
    name: item.name,
  }));
}

module.exports = init;
