import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [resolve(), commonjs()];

const config = [
  {
    input: 'lib/common-js-modules.js',
    output: {
      format: 'es',
      file: 'lib/common-js-modules.esm.js',
      sourcemap: true
    },
    plugins
  }
];

export default config;
