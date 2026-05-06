export const countryFilter = (req, res, next) => {
  // If super-admin or regular admin, no filter — see everything
  if (!req.admin) return next();
  if (req.admin.role === 'super-admin' || req.admin.role === 'admin') {
    req.countryFilter = {}; // empty filter = see all
    return next();
  }
  // If country-admin, restrict to their country only
  if (req.admin.role === 'country-admin' && req.admin.country) {
    req.countryFilter = { country: req.admin.country };
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};

