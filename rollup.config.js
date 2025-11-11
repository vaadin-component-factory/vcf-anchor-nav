import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';
import postcss from 'postcss';
import atImport from 'postcss-import';
import url from 'postcss-url';

export default {
  input: 'demo/*.html',
  output: { dir: 'build' },
  plugins: [
    nodeResolve(),
    html({
      bundleAssetsFromCss: true,
      transformAsset: [
        async (content, filePath) => {
          if (filePath.endsWith('.css')) {
            const result = await postcss()
              .use(atImport())
              .use(url({ url: 'rebase' }))
              .process(content, {
                from: filePath,
              });
            return result.css;
          }
        },
      ],
    }),
    terser(),
  ],
};
