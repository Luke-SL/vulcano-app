const { configure } = require('quasar/wrappers')

module.exports = configure(function () {
  return {
    boot: ['supabase'],

    css: ['app.scss'],

    extras: [
      'material-icons'
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20'
      },
      vueRouterMode: 'hash'
    },

    devServer: {
      open: true
    },

    framework: {
      config: {
        dark: true
      },
      plugins: ['Notify', 'Dialog']
    },

    animations: [],

    ssr: {
      pwa: false
    },

    pwa: {
      workboxMode: 'GenerateSW'
    },

    electron: {
      inspectPort: 5858,
      bundler: 'packager'
    }
  }
})
