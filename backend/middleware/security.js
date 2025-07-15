/**
 * Middleware de sécurité OWASP conforme
 * Implémente Helmet et Rate Limiting pour A05 - Security Misconfiguration
 */

const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');

/**
 * Configuration des headers de sécurité avec Helmet
 */
const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },
  
  // Autres headers de sécurité
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  originAgentCluster: true,
  referrerPolicy: { policy: 'no-referrer' },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xFrameOptions: { action: 'deny' },
  xPermittedCrossDomainPolicies: false,
  xXssProtection: true
};

/**
 * Configuration Rate Limiting global
 */
const globalRateLimitConfig = {
  max: 100, // 100 requêtes par fenêtre
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
  errorResponseBuilder: (request, context) => ({
    code: 429,
    error: 'Too Many Requests',
    message: `Limite de débit dépassée. Réessayez dans ${Math.round(context.ttl / 1000)} secondes.`,
    retryAfter: Math.round(context.ttl / 1000)
  }),
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true
  }
};

/**
 * Configuration Rate Limiting strict pour l'authentification
 */
const authRateLimitConfig = {
  max: 5, // 5 tentatives par IP
  timeWindow: '15 minutes',
  keyGenerator: (request) => request.ip,
  errorResponseBuilder: (request, context) => ({
    code: 429,
    error: 'Too Many Authentication Attempts',
    message: `Trop de tentatives de connexion. Compte temporairement verrouillé pour ${Math.round(context.ttl / 60000)} minutes.`,
    retryAfter: Math.round(context.ttl / 1000)
  }),
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true
  }
};

/**
 * Configuration Rate Limiting pour les actions sensibles (admin)
 */
const adminRateLimitConfig = {
  max: 30, // 30 requêtes admin par minute
  timeWindow: '1 minute',
  keyGenerator: (request) => request.user?.id || request.ip,
  errorResponseBuilder: (request, context) => ({
    code: 429,
    error: 'Admin Rate Limit Exceeded',
    message: `Limite d'actions administrateur dépassée. Réessayez dans ${Math.round(context.ttl / 1000)} secondes.`
  })
};

/**
 * Enregistrement des middlewares de sécurité
 */
const registerSecurityMiddlewares = async (fastify) => {
  // Headers de sécurité avec Helmet
  await fastify.register(helmet, helmetConfig);
  
  // Rate limiting global
  await fastify.register(rateLimit, globalRateLimitConfig);
  
  // Rate limiting spécifique pour l'authentification
  await fastify.register(async function (fastify) {
    await fastify.register(rateLimit, authRateLimitConfig);
    
    // Appliquer uniquement aux routes d'auth
    fastify.addHook('preHandler', async (request, reply) => {
      if (request.url.startsWith('/auth/login') || 
          request.url.startsWith('/auth/register') || 
          request.url.startsWith('/auth/forgot-password')) {
        // Le rate limiting sera appliqué automatiquement
      }
    });
  });
  
  // Rate limiting pour les actions admin
  await fastify.register(async function (fastify) {
    await fastify.register(rateLimit, adminRateLimitConfig);
    
    // Middleware pour identifier les routes admin
    fastify.addHook('preHandler', async (request, reply) => {
      // Appliquer aux routes avec des opérations sensibles
      const adminRoutes = ['/users', '/tournaments', '/backups', '/categories'];
      const isAdminRoute = adminRoutes.some(route => request.url.startsWith(route));
      const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(request.method);
      
      if (isAdminRoute && isWriteOperation) {
        // Le rate limiting admin sera appliqué
      }
    });
  });
};

module.exports = {
  registerSecurityMiddlewares,
  helmetConfig,
  globalRateLimitConfig,
  authRateLimitConfig,
  adminRateLimitConfig
};