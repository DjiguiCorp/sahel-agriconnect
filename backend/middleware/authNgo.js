import jwt from 'jsonwebtoken';
import GovernmentAdmin from '../models/GovernmentAdmin.js';

export const NGO_ORG_TYPES = ['ngo', 'international_org'];

export async function authNgo(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'country_admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const admin = await GovernmentAdmin.findById(decoded.id).lean();
    if (!admin) return res.status(401).json({ success: false, error: 'Account not found' });
    if (admin.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account not active' });
    }

    const orgType = admin.orgType || 'government';
    if (!NGO_ORG_TYPES.includes(orgType)) {
      return res.status(403).json({
        success: false,
        error: 'NGO portal is for NGO and international organization accounts only.',
      });
    }

    req.ngoAdmin = {
      id: admin._id,
      email: admin.email,
      country: admin.country,
      countryCode: admin.countryCode,
      name: admin.name,
      organization: admin.organization,
      orgType,
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
