import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import url from '@rollup/plugin-url';
import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    }
  };
}

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js'
  },
  plugins: [
    // Direct Copy
    copy({
      targets: [
        { src: 'node_modules/bootstrap-icons/font/fonts/*', dest: 'public/build/fonts' },
      ]
    }),
    // ONLY Applies to *.svelte files
    svelte({
      preprocess: sveltePreprocess({
        sourceMap: !production,
        // Handles POSTCSS for *.svelte files
        postcss: {
          plugins: [
            //            require("tailwindcss"),
            require("autoprefixer"),
            require("postcss-nesting")
          ]
        },
      }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production
      }
    }),
    // HANDLE *.sass and *.scss files
    postcss({
      extract: true,
      minimize: !production,
      sourceMap: !production,
      use: [
        ['sass', {
          includePaths: [
            './theme',
            './node_modules'
          ]
        }]
      ]
    }),
    // HANDLE Font Files
    url({
      // by default, rollup-plugin-url will not handle font files
      include: ['**/*.ttf', '**/*.woff', '**/*.woff2'], // Files to Copy (Required for Material Icons)
      publicPath: 'public/fonts', // OUTPUT Directory
      fileName: '[name][extname]', // Maintain File Names
      limit: 0, // No Size Limit
    }),
    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),
    json(),
    typescript({
      sourceMap: !production,
      inlineSources: !production
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    buildDelay: 10000, // 15 second build delay
    clearScreen: true
  }
};
