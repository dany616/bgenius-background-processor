import typescript from 'rollup-plugin-typescript2';
import { dts } from 'rollup-plugin-dts';

const config = [
  // ES Module and CommonJS builds
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
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
  // CLI build
  {
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      sourcemap: true,
    },
    plugins: [
      typescript({
        typescript: require('typescript'),
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
  // Type definitions
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];

export default config; 