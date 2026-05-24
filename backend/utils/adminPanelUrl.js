/** Admin dashboard deep-link (always requires fresh login) */
export function adminPanelLoginUrl({ tab, sub } = {}) {
  const base = (
    process.env.ADMIN_PANEL_URL ||
    process.env.FRONTEND_URL ||
    'https://sahelagriconnect.com'
  ).replace(/\/$/, '');
  const q = new URLSearchParams();
  q.set('return', '/admin/central');
  if (tab) q.set('tab', tab);
  if (sub) q.set('sub', sub);
  return `${base}/admin/login?${q.toString()}`;
}
