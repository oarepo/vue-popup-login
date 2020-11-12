import Vue from 'vue'
import router from './router'
import vuetify from './plugins/vuetify';

import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.config.productionTip = false

import CompositionApi from '@vue/composition-api'
Vue.use(CompositionApi)

import PopupLogin from '@oarepo/vue-composition-popup-login'
Vue.use(PopupLogin, {
    router
})


import App from './App.vue'
const root = new Vue({
    router,
    vuetify,
    render: h => h(App)
}).$mount('#app')
