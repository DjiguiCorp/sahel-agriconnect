import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'admin existe toujours
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: 'Admin non trouvé' });
    }

    req.admin = admin;
    req.adminId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

/**
 * Mobile app JWTs (investor, cooperative leader, government admin).
 */
export const authenticateAnyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'investor' && decoded.email) {
      req.mobileUser = {
        role: 'investor',
        email: String(decoded.email).toLowerCase().trim(),
      };
      return next();
    }

    if (decoded.role === 'cooperative_leader' && decoded.coopId) {
      req.mobileUser = {
        role: 'cooperative_leader',
        id: decoded.coopId,
        email: decoded.email,
      };
      return next();
    }

    if (decoded.role === 'country_admin' && decoded.id) {
      req.mobileUser = {
        role: 'country_admin',
        id: decoded.id,
        email: decoded.email,
      };
      return next();
    }

    if (decoded.role === 'farmer' && decoded.id) {
      req.mobileUser = {
        role: 'farmer',
        id: decoded.id,
        email: decoded.email,
      };
      return next();
    }

    if (decoded.role === 'processor' && decoded.id) {
      req.mobileUser = {
        role: 'processor',
        id: decoded.id,
        email: decoded.email,
      };
      return next();
    }

    return res.status(403).json({ error: 'Rôle non pris en charge pour cette opération' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

export const authenticateInvestor = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== 'investor' || !decoded.email) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    req.investorEmail = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

