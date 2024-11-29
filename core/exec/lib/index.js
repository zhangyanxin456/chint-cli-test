'use strict';

module.exports = exec;

function exec() {
  console.log('Hello from exec', process.env.CLI_TARGET_PATH, 66666);
  return 'Hello from exec';
}
