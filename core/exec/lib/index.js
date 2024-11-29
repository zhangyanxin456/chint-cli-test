'use strict';

module.exports = exec;

function exec() {
  console.log('Hello from exec', process.env, 66666);
  return 'Hello from exec';
}
