const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'catalogo', name: 'catalogo', component: () => import('pages/CatalogoPage.vue') },
      { path: 'entrada', name: 'entrada', component: () => import('pages/EntradaEstoquePage.vue') },
      { path: 'saida', name: 'saida', component: () => import('pages/SaidaEstoquePage.vue') },
      { path: 'relatorios', name: 'relatorios', component: () => import('pages/RelatoriosPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
