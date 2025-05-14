import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE)
  })

  // Garde de navigation pour vérifier l'authentification
  Router.beforeEach((to, from, next) => {
    // Vérifier si la route nécessite une authentification
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // Vérifier si l'utilisateur est connecté (token présent dans localStorage)
      const token = localStorage.getItem('token')
      
      if (!token) {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
        next({
          path: '/login',
          query: { redirect: to.fullPath }  // Pour rediriger après la connexion
        })
      } else {
        // Vérifier si la route nécessite des droits d'administrateur
        if (to.matched.some(record => record.meta.requiresAdmin)) {
          // Récupérer les informations de l'utilisateur
          const user = localStorage.getItem('user')
          if (user) {
            try {
              const userData = JSON.parse(user)
              // Vérifier si l'utilisateur est un administrateur
              if (userData.role === 'admin') {
                next() // Autoriser l'accès à la route admin
              } else {
                // Rediriger vers la page d'accueil si l'utilisateur n'est pas administrateur
                next({ path: '/' })
                // Notification d'accès refusé
                import('quasar').then(({ Notify }) => {
                  Notify.create({
                    type: 'negative',
                    message: 'Accès refusé. Vous devez être administrateur pour accéder à cette page.',
                    position: 'top-right',
                    timeout: 3000
                  })
                })
              }
            } catch (e) {
              next({ path: '/' })
            }
          } else {
            next({ path: '/' })
          }
        } else {
          // Continuer la navigation si l'utilisateur est connecté
          next()
        }
      }
    } else {
      // Si la route ne nécessite pas d'authentification, continuer
      next()
    }
  })

  return Router
})
