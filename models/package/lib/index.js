'use strict';

const { getDefaultRegistry, getNpmLatestVersion } = require('@chint-cli-test/get-npm-info');
const npminstall = require('npminstall');
const path = require('path');
const userHome = require("user-home");
const fse = require('fs-extra');
const fs = require('fs');
const pkgDir = require('pkg-dir').sync;
const log = require('@chint-cli-test/log');
const useOriginNpm = false;

class Package {
  constructor(options) {
    console.log(path.join(userHome, process.env.CLI_HOME), process.env.CLI_HOME, 1616, userHome)
    // package的目标路径
    this.targetPath = options.targetPath;
    // 缓存package的路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.packageName;
    // package的version
    this.packageVersion = options.packageVersion;
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }
  async prepare() {
    if (!fs.existsSync(this.targetPath)) {
      fse.mkdirpSync(this.targetPath);
    }
    if (!fs.existsSync(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    const latestVersion = await getNpmLatestVersion(this.packageName);
    if (latestVersion) {
      this.packageVersion = latestVersion;
    }
  }

  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(),
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion,
      }],
    });
  }

  async exists() {
    await this.prepare();
    return fs.existsSync(this.npmFilePath);
  }
  getPackage(isOriginal = false) {
    if (!isOriginal) {
      return fse.readJsonSync(path.resolve(this.npmFilePath, 'package.json'));
    }
    return fse.readJsonSync(path.resolve(this.storePath, 'package.json'));
  }
  async getVersion() {
    await this.prepare();
    return await this.exists() ? this.getPackage().version : null;
  }
  async getLatestVersion() {
    const version = await this.getVersion();
    if (version) {
      const latestVersion = await getNpmLatestVersion(this.packageName, version);
      return latestVersion;
    }
    return null;
  }
  // 更新package
  async update() {
    const latestVersion = await this.getLatestVersion();
    log.info(latestVersion, 7575757)
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: npm.getNpmRegistry(useOriginNpm),
      pkgs: [{
        name: this.packageName,
        version: latestVersion,
      }],
    });
  }
  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }
  
  // 获取入口文件的路径
  getRootFilePath() {
    function formatPath(p) {
      if (p && typeof p === 'string') {
        const sep = path.sep;
        if (sep === '/') {
          return p;
        } else {
          return p.replace(/\\/g, '/');
        }
      }
      return p;
    }
    function _getRootFile(targetPath) {
      // 1. 获取package.json所在目录
      const dir = pkgDir(targetPath);
      if (dir) {
        // 2. 读取package.json
        const pkgFile = require(path.resolve(dir, 'package.json'));
        console.log(pkgFile, 101)
        // 3. 寻找main/lib
        if (pkgFile && pkgFile.main) {
          // 4. 路径的兼容(macOS/windows)
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }
      return null;
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath);
    } else {
      return _getRootFile(this.targetPath);
    }
  }
}
module.exports = Package;
