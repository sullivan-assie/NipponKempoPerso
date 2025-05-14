const authMiddleware = require('../../middleware/auth');

describe('Tests des middlewares d\'authentification', () => {
  let mockRequest;
  let mockReply;
  let mockNext;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    mockRequest = {
      jwtVerify: jest.fn(),
      query: {},
      server: {
        jwt: {
          verify: jest.fn()
        }
      },
      user: null
    };
    
    mockReply = {
      code: jest.fn(() => mockReply),
      send: jest.fn(() => mockReply)
    };
    
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('doit continuer si le token JWT est valide', async () => {
      // Simuler une vérification JWT réussie
      mockRequest.jwtVerify.mockResolvedValue({ id: '123', role: 'user' });
      
      await authMiddleware.authenticate(mockRequest, mockReply);
      
      // Vérifier que jwtVerify a été appelé
      expect(mockRequest.jwtVerify).toHaveBeenCalled();
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
    
    it('doit vérifier le token dans les paramètres de requête si présent', async () => {
      // Simuler un token dans les paramètres de requête
      mockRequest.query.token = 'valid-token';
      mockRequest.server.jwt.verify.mockResolvedValue({ id: '123', role: 'user' });
      
      await authMiddleware.authenticate(mockRequest, mockReply);
      
      // Vérifier que server.jwt.verify a été appelé avec le token
      expect(mockRequest.server.jwt.verify).toHaveBeenCalledWith('valid-token');
      
      // Vérifier que jwtVerify n'a pas été appelé puisqu'on a utilisé server.jwt.verify
      expect(mockRequest.jwtVerify).not.toHaveBeenCalled();
      
      // Vérifier que l'utilisateur a bien été défini dans la requête
      expect(mockRequest.user).toEqual({ id: '123', role: 'user' });
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
    
    it('doit retourner une erreur 401 si le token JWT est invalide', async () => {
      // Simuler une erreur lors de la vérification JWT
      mockRequest.jwtVerify.mockRejectedValue(new Error('JWT invalide'));
      
      await authMiddleware.authenticate(mockRequest, mockReply);
      
      // Vérifier que code() et send() ont été appelés avec les bonnes valeurs
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
    });
  });
  
  describe('authenticateOptional', () => {
    it('doit définir l\'utilisateur si le token est valide', async () => {
      const userData = { id: '123', role: 'user' };
      mockRequest.jwtVerify.mockResolvedValue(userData);
      
      await authMiddleware.authenticateOptional(mockRequest, mockReply);
      
      // Vérifier que jwtVerify a été appelé
      expect(mockRequest.jwtVerify).toHaveBeenCalled();
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
    
    it('doit définir user à null si le token est invalide', async () => {
      // Simuler une erreur lors de la vérification JWT
      mockRequest.jwtVerify.mockRejectedValue(new Error('JWT invalide'));
      
      await authMiddleware.authenticateOptional(mockRequest, mockReply);
      
      // Vérifier que user est défini à null
      expect(mockRequest.user).toBeNull();
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });
  
  describe('isAdmin', () => {
    it('doit autoriser les administrateurs', async () => {
      // Simuler un utilisateur admin
      mockRequest.user = { id: '123', role: 'admin' };
      
      await authMiddleware.isAdmin(mockRequest, mockReply);
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
    
    it('doit refuser l\'accès aux utilisateurs non-administrateurs', async () => {
      // Simuler un utilisateur standard
      mockRequest.user = { id: '123', role: 'user' };
      
      await authMiddleware.isAdmin(mockRequest, mockReply);
      
      // Vérifier que code() et send() ont été appelés avec les bonnes valeurs
      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Accès restreint aux administrateurs'
      });
    });
    
    it('doit refuser l\'accès si aucun utilisateur n\'est authentifié', async () => {
      // Pas d'utilisateur authentifié
      mockRequest.user = null;
      
      await authMiddleware.isAdmin(mockRequest, mockReply);
      
      // Vérifier que code() et send() ont été appelés avec les bonnes valeurs
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
    });
  });
  
  describe('checkPermissions', () => {
    it('doit autoriser les utilisateurs avec un rôle autorisé', async () => {
      // Simuler un utilisateur avec un rôle autorisé
      mockRequest.user = { id: '123', role: 'editor' };
      
      const checkEditorPermission = authMiddleware.checkPermissions(['admin', 'editor']);
      await checkEditorPermission(mockRequest, mockReply);
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
    
    it('doit refuser l\'accès aux utilisateurs avec un rôle non autorisé', async () => {
      // Simuler un utilisateur avec un rôle non autorisé
      mockRequest.user = { id: '123', role: 'user' };
      
      const checkAdminPermission = authMiddleware.checkPermissions(['admin']);
      await checkAdminPermission(mockRequest, mockReply);
      
      // Vérifier que code() et send() ont été appelés avec les bonnes valeurs
      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Permission refusée'
      });
    });
    
    it('doit autoriser tous les utilisateurs authentifiés si aucun rôle n\'est spécifié', async () => {
      // Simuler un utilisateur authentifié quelconque
      mockRequest.user = { id: '123', role: 'guest' };
      
      const checkAnyAuthenticatedUser = authMiddleware.checkPermissions([]);
      await checkAnyAuthenticatedUser(mockRequest, mockReply);
      
      // Vérifier que code() et send() n'ont pas été appelés (pas d'erreur)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
    
    it('doit refuser l\'accès si aucun utilisateur n\'est authentifié', async () => {
      // Pas d'utilisateur authentifié
      mockRequest.user = null;
      
      const checkAnyPermission = authMiddleware.checkPermissions(['user', 'admin']);
      await checkAnyPermission(mockRequest, mockReply);
      
      // Vérifier que code() et send() ont été appelés avec les bonnes valeurs
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
    });
  });
});