const routes = [
  // Route principale pour la page d'accueil uniquement
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }
    ]
  },
  
  // Routes pour le menu principal et autres pages
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: 'main-menu', 
        component: () => import('pages/mainMenu.vue'),
        meta: { requiresAuth: true, requiresAdmin: true } // Restriction pour admin uniquement
      },
      { path: 'categories', component: () => import('pages/CategoriesPage.vue') },
      { path: 'teams', component: () => import('pages/TeamPage.vue') },
      { path: 'assistants', component: () => import('pages/AssistantPage.vue') },
      { path: 'tournois', component: () => import('pages/BracketTournois.vue') },
      { path: 'mode', component: () => import('pages/SelectMode.vue') },
      { path: 'test', component: () => import('pages/test.vue') }
    ]
  },

  // Routes pour utilisateurs standards - liste des tournois disponibles
  {
    path: '/tournaments',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/TournamentsPage.vue') },
      { path: ':id', component: () => import('pages/TournamentDetailPage.vue') }
    ],
    meta: { requiresAuth: true }
  },
  
  // Routes d'authentification
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') }
    ]
  },
  
  // Routes de réinitialisation de mot de passe
  {
    path: '/forgot-password',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ForgotPasswordPage.vue') }
    ]
  },
  {
    path: '/reset-password/:token',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ResetPasswordPage.vue') }
    ]
  },
  {
    path: '/arbitre',
    component: () => import('layouts/ArbitreLayout.vue'),
    children: [
      { path: '', component: () => import('pages/mainMenu.vue') }
    ]
  },
  {
    path: '/scoreBoard',
    component: () => import('layouts/ScoreBoardLayout.vue'),
    children: [
      { path: 'result', component: () => import('components/Results.vue') }
    ]
  },
  {
    path: '/scoreBoardApp',
    component: () => import('components/ScoreboardApp.vue')
  },
  {
    path: '/bracket',
    component: () => import('layouts/BracketLayout.vue')
  },
  
  // Route permettant d'accéder aux fonctionnalités de synchronisation
  {
    path: '/sync',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('components/SyncStatus.vue') }
    ],
    meta: { requiresAuth: true }  // Cette route nécessite une authentification
  },
  {
    path: '/profil',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ProfilPage.vue') }
    ],
    meta: { requiresAuth: true }
  },
  
  // Routes d'administration
  {
    path: '/admin',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'users', component: () => import('pages/admin/UserManagementPage.vue') },
      { path: 'clubs', component: () => import('pages/ClubsPage.vue') }
    ],
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
