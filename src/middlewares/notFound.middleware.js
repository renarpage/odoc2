'use strict';
module.exports = (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ success: false, message: 'Not found' });
  res.status(404).render('404', { title: 'Halaman tidak ditemukan' });
};
