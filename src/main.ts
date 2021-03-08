import './styles/quasar.sass'
import '@quasar/extras/material-icons/material-icons.css'

import PopupLogin from '@oarepo/vue-popup-login'
import {
    Dialog,
    QAvatar,
    QBtn,
    QDrawer, QFooter,
    QHeader,
    QIcon,
    QLayout, QPage, QPageContainer,
    QRouteTab,
    QTabs,
    QToolbar,
    QToolbarTitle,
    Quasar
} from 'quasar'


import {createApp} from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)
    .use(router)
    .use(Quasar, {
        config: {},
        plugins: {
            Dialog
        },
        components: [
            QIcon,
            QLayout, QHeader, QToolbar, QToolbarTitle, QBtn,
            QAvatar, QTabs, QRouteTab, QDrawer,
            QPageContainer, QFooter, QPage
        ],
    })
    .use(PopupLogin, {
        router
    })
    .mount('#app')
