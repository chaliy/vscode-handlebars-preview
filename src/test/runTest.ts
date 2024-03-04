import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { runTests } from '@vscode/test-electron';

async function main() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hbs-preview-'));

  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [`--user-data-dir=${userDataDir}`],
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exitCode = 1;
  } finally {
    fs.rmSync(userDataDir, { force: true, recursive: true });
  }
}

main();
