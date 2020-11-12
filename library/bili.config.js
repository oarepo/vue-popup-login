const config = {
  input: 'index.ts',
//  babel: {
//    minimal: true
//  },
  output: {
    dir: '../dist',
    fileName: 'oarepo-vue-popup-login.[format].js',
    format: ['esm'],
    minify: false,
    sourceMap: false,
    moduleName: 'oarepo-vue-popup-login'
  },
  plugins: {
    // babel: {babelHelpers: 'runtime', exclude: 'node_modules/**'},
    babel: false,
    typescript2: {
      // tsconfigOverride: {
      //   include: ['library']
      // }
    }
  }
}

export default config

