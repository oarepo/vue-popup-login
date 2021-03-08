import {createRouter, createWebHashHistory} from 'vue-router'
import Home from './views/Home.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/editors',
        name: 'editors',
        component: () => import(/* webpackChunkName: "about" */ './views/Editors.vue'),
        meta: {
            authorization: {
                needsRequired: ['editors']
            }
        }
    },
    {
        path: '/protected',
        name: 'protected',
        component: () => import(/* webpackChunkName: "about" */ './views/Protected.vue'),
        meta: {
            authorization: {}
        }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
})

export default router
