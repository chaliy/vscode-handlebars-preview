//@ts-check
'use strict';

const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const webTests = process.argv.includes('--web-tests');

async function main() {
  if (webTests) {
    await esbuild.build({
      entryPoints: ['src/test/web/extensionTests.ts'],
      bundle: true,
      format: 'cjs',
      sourcemap: true,
      sourcesContent: false,
      platform: 'browser',
      target: 'es2020',
      outfile: 'out/web/test/extensionTests.js',
      external: ['vscode'],
      logLevel: 'warning',
      mainFields: ['browser', 'module', 'main']
    });
    return;
  }

  const context = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    target: 'es2020',
    outfile: 'out/extension.js',
    external: ['vscode'],
    logLevel: 'warning',
    mainFields: ['browser', 'module', 'main']
  });

  if (watch) {
    await context.watch();
    return;
  }

  await context.rebuild();
  await context.dispose();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
