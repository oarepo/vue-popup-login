import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/editors',
    name: 'editors',
    component: () => import(/* webpackChunkName: "about" */ '../views/Editors.vue'),
    meta: {
      authorization: {
        needsRequired: ['editors']
      }
    }
  },
  {
    path: '/protected',
    name: 'protected',
    component: () => import(/* webpackChunkName: "about" */ '../views/Protected.vue'),
    meta: {
      authorization: {}
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
