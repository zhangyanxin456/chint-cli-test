'use strict';

const { getDefaultRegistry, getNpmLatestVersion } = require('@chint-cli-test/get-npm-info');
const npminstall = require('npminstall');
const path = require('path');
const pathExists = require('path-exists').sync;
const fse = require('fs-extra');
const fs = require('fs');
const log = require('@chint-cli-test/log');
const useOriginNpm = false;

class Package {
  constructor(options) {
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
    log.info(this.storeDir, 'this.packageName', this.packageName, this.packageVersion);
    const latestVersion = await getNpmLatestVersion(this.packageName, this.packageVersion);
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
  // 更新package
  update() {}
  // 获取入口文件的路径
  getRootFilePath() {}
}
module.exports = Package;
