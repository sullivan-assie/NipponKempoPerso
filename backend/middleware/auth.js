// backend/middleware/auth.js
/**
 * Middleware d'authentification pour sécuriser les routes API
 */

exports.authenticate = async (request, reply) => {
  try {
    // Vérifier si le token est passé en paramètre de requête
    if (request.query && request.query.token) {
      // Si le token est fourni en paramètre, le vérifier manuellement
      const decoded = await request.server.jwt.verify(request.query.token);
      request.user = decoded;
    } else {
      // Sinon, utiliser la méthode standard de vérification JWT
      await request.jwtVerify();
    }
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Authentification requise' });
  }
};

// Middleware d'authentification optionnelle : vérifie le token s'il existe 
// mais n'échoue pas si aucun token n'est fourni
exports.authenticateOptional = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Ne pas échouer si l'authentification échoue, simplement continuer
    request.user = null;
  }
};

// Middleware pour vérifier si l'utilisateur est administrateur (version asynchrone compatible avec Fastify)
exports.isAdmin = async (request, reply) => {
  // S'assurer que l'utilisateur est authentifié
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Authentification requise' });
  }
  
  // Vérifier si l'utilisateur a le rôle admin
  if (request.user.role !== 'admin') {
    return reply.code(403).send({ error: 'Forbidden', message: 'Accès restreint aux administrateurs' });
  }
};

// Vérifier les permissions d'un utilisateur
exports.checkPermissions = (roles = []) => {
  return async (request, reply) => {
    // Vérifier si l'utilisateur est authentifié
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Authentification requise' });
    }
    
    // Si aucun rôle n'est spécifié, autoriser tous les utilisateurs authentifiés
    if (roles.length === 0) {
      return;
    }
    
    // Vérifier si l'utilisateur a le rôle requis
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Permission refusée' });
    }
  };
};