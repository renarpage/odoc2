module.exports = function notFound(req, res) {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ success: false, message: "Resource not found" });
  }
  return res.status(404).render("404", { layout: "layouts/guest", title: "Page Not Found" });
};
