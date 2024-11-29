'use strict';

module.exports = exec;
const Package = require('@chint-cli-test/package');
function exec() {
  const pkg = new Package();
  console.log(pkg, 77777)
  console.log('Hello from exec', process.env.CLI_TARGET_PATH, 66666);
  return 'Hello from exec';
}
