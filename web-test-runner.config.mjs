import { puppeteerLauncher } from '@web/test-runner-puppeteer';

export default {
  files: ['test/**/*.test.js'],
  nodeResolve: true,
  browsers: [puppeteerLauncher({ launchOptions: { args: ['--no-sandbox'] } })]
};
