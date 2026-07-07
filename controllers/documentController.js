const asyncHandler = require("../core/asyncHandler");
const documentService = require("../services/documentService");
const { created, ok } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

const upload = asyncHandler(async (req, res) => {
  const docs = await documentService.uploadForActivity(req.params.slug, req.files, ctxOf(req));
  created(res, docs.map((d) => ({ id: String(d._id), name: d.name, url: d.url, size: d.size })));
});

const download = asyncHandler(async (req, res) => {
  const doc = await documentService.registerDownload(req.params.id);
  res.redirect(doc.url);
});

module.exports = { upload, download };
