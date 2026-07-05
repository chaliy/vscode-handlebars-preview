const { defineConfig } = require('@vscode/test-cli');
const os = require('os');
const path = require('path');

module.exports = defineConfig({
  files: 'out/test/**/*.test.js',
  mocha: {
    ui: 'tdd'
  },
  launchArgs: [
    '--disable-extensions',
    '--user-data-dir',
    path.join(os.tmpdir(), 'handlebars-preview-vscode-test-user')
  ]
});
