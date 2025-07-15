/**
 * Logger de sécurité OWASP conforme
 * Implémente le logging et monitoring pour A09 - Security Logging & Monitoring Failures
 */

/**
 * Niveaux de sécurité pour les événements
 */
const SECURITY_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN', 
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Types d'événements de sécurité
 */
const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_LOCKOUT: 'AUTH_LOCKOUT',
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATA_ACCESS: 'DATA_ACCESS',
  DATA_MODIFICATION: 'DATA_MODIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ACCOUNT_CREATION: 'ACCOUNT_CREATION',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

/**
 * Classe principale du logger de sécurité
 */
class SecurityLogger {
  constructor(fastifyLogger) {
    this.logger = fastifyLogger;
    this.failedAttempts = new Map(); // Tracking des tentatives échouées
  }

  /**
   * Log d'un événement de sécurité générique
   */
  logSecurityEvent(level, eventType, details) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      level,
      eventType,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      userId: details.userId || 'anonymous',
      email: details.email || null,
      endpoint: details.endpoint || null,
      method: details.method || null,
      sessionId: details.sessionId || null,
      message: details.message || '',
      metadata: details.metadata || {}
    };

    // Log selon le niveau
    switch (level) {
      case SECURITY_LEVELS.INFO:
        this.logger.info(securityEvent, `[SECURITY-${eventType}] ${details.message}`);
        break;
      case SECURITY_LEVELS.WARN:
        this.logger.warn(securityEvent, `[SECURITY-${eventType}] ${details.message}`);
        break;
      case SECURITY_LEVELS.ERROR:
        this.logger.error(securityEvent, `[SECURITY-${eventType}] ${details.message}`);
        break;
      case SECURITY_LEVELS.CRITICAL:
        this.logger.fatal(securityEvent, `[SECURITY-${eventType}] ${details.message}`);
        // En production, déclencher des alertes
        this.triggerAlert(securityEvent);
        break;
    }

    return securityEvent;
  }

  /**
   * Log de connexion réussie
   */
  logAuthSuccess(userId, email, ip, userAgent) {
    // Nettoyer les tentatives échouées pour cet utilisateur
    const key = `${email}:${ip}`;
    this.failedAttempts.delete(key);

    return this.logSecurityEvent(SECURITY_LEVELS.INFO, SECURITY_EVENTS.AUTH_SUCCESS, {
      userId,
      email,
      ip,
      userAgent,
      message: `Connexion réussie pour l'utilisateur ${email}`,
      metadata: { loginTime: new Date().toISOString() }
    });
  }

  /**
   * Log de tentative de connexion échouée
   */
  logAuthFailure(email, ip, userAgent, reason = 'Invalid credentials') {
    const key = `${email}:${ip}`;
    const attempts = this.failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.failedAttempts.set(key, attempts);

    const level = attempts.count >= 3 ? SECURITY_LEVELS.ERROR : SECURITY_LEVELS.WARN;

    return this.logSecurityEvent(level, SECURITY_EVENTS.AUTH_FAILURE, {
      email,
      ip,
      userAgent,
      message: `Tentative de connexion échouée pour ${email} (tentative ${attempts.count}) - ${reason}`,
      metadata: { 
        reason, 
        attemptCount: attempts.count,
        firstAttempt: new Date(attempts.firstAttempt).toISOString()
      }
    });
  }

  /**
   * Log de verrouillage de compte
   */
  logAuthLockout(email, ip, userAgent) {
    return this.logSecurityEvent(SECURITY_LEVELS.CRITICAL, SECURITY_EVENTS.AUTH_LOCKOUT, {
      email,
      ip,
      userAgent,
      message: `Compte temporairement verrouillé pour ${email} après plusieurs tentatives échouées`,
      metadata: { lockoutDuration: '15 minutes' }
    });
  }

  /**
   * Log de tentative d'escalade de privilèges
   */
  logPrivilegeEscalation(userId, email, ip, attemptedAction, userAgent) {
    return this.logSecurityEvent(SECURITY_LEVELS.CRITICAL, SECURITY_EVENTS.PRIVILEGE_ESCALATION, {
      userId,
      email,
      ip,
      userAgent,
      message: `Tentative d'escalade de privilèges par ${email} - Action: ${attemptedAction}`,
      metadata: { attemptedAction, currentRole: 'user' }
    });
  }

  /**
   * Log d'accès non autorisé
   */
  logUnauthorizedAccess(ip, userAgent, endpoint, method) {
    return this.logSecurityEvent(SECURITY_LEVELS.ERROR, SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
      ip,
      userAgent,
      endpoint,
      method,
      message: `Tentative d'accès non autorisé à ${method} ${endpoint}`,
      metadata: { requiresAuth: true }
    });
  }

  /**
   * Log de dépassement de limite de débit
   */
  logRateLimitExceeded(ip, userAgent, endpoint, limit) {
    return this.logSecurityEvent(SECURITY_LEVELS.WARN, SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, {
      ip,
      userAgent,
      endpoint,
      message: `Limite de débit dépassée pour ${ip} sur ${endpoint}`,
      metadata: { limit, timeWindow: '1 minute' }
    });
  }

  /**
   * Log d'accès aux données sensibles
   */
  logDataAccess(userId, email, resource, action, ip) {
    const level = action === 'READ' ? SECURITY_LEVELS.INFO : SECURITY_LEVELS.WARN;
    
    return this.logSecurityEvent(level, SECURITY_EVENTS.DATA_ACCESS, {
      userId,
      email,
      ip,
      message: `Accès aux données: ${action} sur ${resource} par ${email}`,
      metadata: { resource, action, dataType: 'sensitive' }
    });
  }

  /**
   * Log de modification de données
   */
  logDataModification(userId, email, resource, action, ip, changes = {}) {
    return this.logSecurityEvent(SECURITY_LEVELS.WARN, SECURITY_EVENTS.DATA_MODIFICATION, {
      userId,
      email,
      ip,
      message: `Modification de données: ${action} sur ${resource} par ${email}`,
      metadata: { resource, action, changes }
    });
  }

  /**
   * Log de réinitialisation de mot de passe
   */
  logPasswordReset(email, ip, userAgent, method = 'email') {
    return this.logSecurityEvent(SECURITY_LEVELS.WARN, SECURITY_EVENTS.PASSWORD_RESET, {
      email,
      ip,
      userAgent,
      message: `Demande de réinitialisation de mot de passe pour ${email}`,
      metadata: { method, initiatedBy: 'user' }
    });
  }

  /**
   * Log de création de compte
   */
  logAccountCreation(email, ip, userAgent, role = 'user') {
    const level = role === 'admin' ? SECURITY_LEVELS.WARN : SECURITY_LEVELS.INFO;
    
    return this.logSecurityEvent(level, SECURITY_EVENTS.ACCOUNT_CREATION, {
      email,
      ip,
      userAgent,
      message: `Nouveau compte créé pour ${email} avec le rôle ${role}`,
      metadata: { role, registrationMethod: 'standard' }
    });
  }

  /**
   * Log d'activité suspecte
   */
  logSuspiciousActivity(ip, userAgent, description, metadata = {}) {
    return this.logSecurityEvent(SECURITY_LEVELS.ERROR, SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
      ip,
      userAgent,
      message: `Activité suspecte détectée: ${description}`,
      metadata: { ...metadata, autoDetected: true }
    });
  }

  /**
   * Déclencher des alertes pour les événements critiques
   */
  triggerAlert(securityEvent) {
    // En production, intégrer avec des systèmes d'alerte (email, Slack, SMS, etc.)
    console.error('🚨 ALERTE SÉCURITÉ CRITIQUE 🚨', {
      timestamp: securityEvent.timestamp,
      eventType: securityEvent.eventType,
      message: securityEvent.message,
      ip: securityEvent.ip,
      userId: securityEvent.userId
    });
  }

  /**
   * Obtenir les statistiques de sécurité
   */
  getSecurityStats() {
    const stats = {
      failedAttemptsCount: this.failedAttempts.size,
      failedAttempts: Array.from(this.failedAttempts.entries()).map(([key, data]) => ({
        identifier: key,
        attempts: data.count,
        firstAttempt: new Date(data.firstAttempt).toISOString(),
        lastAttempt: new Date(data.lastAttempt).toISOString()
      }))
    };

    return stats;
  }

  /**
   * Nettoyer les tentatives anciennes (appeler périodiquement)
   */
  cleanupOldAttempts() {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutes

    for (const [key, attempts] of this.failedAttempts.entries()) {
      if (now - attempts.lastAttempt > maxAge) {
        this.failedAttempts.delete(key);
      }
    }
  }
}

/**
 * Middleware pour logger automatiquement les événements de sécurité
 */
const createSecurityLoggingMiddleware = (securityLogger) => {
  return async (request, reply) => {
    // Logger les accès non autorisés
    reply.addHook('onSend', async (request, reply, payload) => {
      if (reply.statusCode === 401) {
        securityLogger.logUnauthorizedAccess(
          request.ip,
          request.headers['user-agent'],
          request.url,
          request.method
        );
      }
      
      if (reply.statusCode === 403) {
        securityLogger.logPrivilegeEscalation(
          request.user?.id,
          request.user?.email,
          request.ip,
          `${request.method} ${request.url}`,
          request.headers['user-agent']
        );
      }

      if (reply.statusCode === 429) {
        securityLogger.logRateLimitExceeded(
          request.ip,
          request.headers['user-agent'],
          request.url,
          'Rate limit'
        );
      }
    });
  };
};

module.exports = {
  SecurityLogger,
  SECURITY_LEVELS,
  SECURITY_EVENTS,
  createSecurityLoggingMiddleware
};