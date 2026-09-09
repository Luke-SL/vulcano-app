import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from 'boot/supabase'
import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHashHistory()
  })

  Router.beforeEach(async (to) => {
    const { data } = await supabase.auth.getSession()
    const autenticado = !!data.session

    if (to.meta.requiresAuth && !autenticado) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (to.path === '/login' && autenticado) {
      return { path: '/dashboard' }
    }

    return true
  })

  return Router
})
