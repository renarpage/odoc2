const asyncHandler = require("../core/asyncHandler");
const galleryService = require("../services/galleryService");
const { created, ok } = require("../helpers/response");

function ctxOf(req) {
  return { userId: req.user && req.user._id, userEmail: req.user && req.user.email, ip: req.ip };
}

const upload = asyncHandler(async (req, res) => {
  const docs = await galleryService.uploadForActivity(req.params.slug, req.files, ctxOf(req));
  created(res, docs.map((d) => ({ id: String(d._id), url: d.url })));
});

const remove = asyncHandler(async (req, res) => {
  ok(res, await galleryService.remove(req.params.id, ctxOf(req)));
});

module.exports = { upload, remove };
