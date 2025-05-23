const typescript = require('rollup-plugin-typescript2');

const config = [
  // Library build
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        typescript: require('typescript'),
        clean: true,
        tsconfig: './tsconfig.json',
      }),
    ],
    external: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-node',
      '@tensorflow-models/body-pix',
      'axios',
      'fs',
      'path',
      'commander',
      'chalk',
      'ora',
      'inquirer',
    ],
  },
];

module.exports = config; 