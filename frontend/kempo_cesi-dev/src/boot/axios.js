// frontend/kempo_cesi-dev/src/boot/axios.js
import { boot } from 'quasar/wrappers';
import axios from 'axios';

// Backend API URL - sera remplacé par l'URL réelle en production
const apiBaseURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : '/api';

// Création d'une instance axios avec une configuration par défaut
const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000, // Timeout de 10 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(config => {
  // Récupérer le token depuis le localStorage
  const token = localStorage.getItem('token');
  
  // Si le token existe, l'ajouter aux headers
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  // Gérer les erreurs de requête
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(response => {
  return response;
}, error => {
  // Si le serveur retourne une erreur 401 (non authentifié)
  if (error.response && error.response.status === 401) {
    // Supprimer le token et rediriger vers la page de connexion
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  
  return Promise.reject(error);
});

export default boot(({ app }) => {
  // Rendre axios disponible dans l'application Vue
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };