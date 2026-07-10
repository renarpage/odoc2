/**
 * In-memory background upload jobs.
 *
 * When an admin creates an activity with files, the activity record is saved
 * immediately and the browser is redirected to the dashboard. The actual
 * cover/gallery/document uploads to Google Drive then run here in the
 * background, and the dashboard polls `listForUser` to show live progress.
 *
 * State is in-memory (single-process app). Finished jobs linger briefly so the
 * dashboard can show a completed state, then self-clean.
 */
const { v4: uuid } = require("uuid");
const logger = require("../config/logger");

// Lazy requires inside the runner avoid load-order cycles with activityService.
const jobs = new Map();
const DONE_TTL_MS = 60 * 1000; // keep finished jobs visible for 1 minute

function publicShape(job) {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    total: job.total,
    done: job.done,
    status: job.status, // uploading | done | partial | error
    percent: job.total ? Math.round((job.done / job.total) * 100) : 100,
    current: job.current,
    error: job.error || null,
    failed: job.failed,
  };
}

function listForUser(userId) {
  const uid = String(userId || "");
  const now = Date.now();
  const out = [];
  jobs.forEach((job, id) => {
    if (job.finishedAt && now - job.finishedAt > DONE_TTL_MS) {
      jobs.delete(id);
      return;
    }
    if (String(job.user) === uid) out.push(publicShape(job));
  });
  // Newest first.
  return out.sort((a, b) => b.id.localeCompare(a.id));
}

function buildTasks(files) {
  const f = files || {};
  const tasks = [];
  if (f.cover && f.cover[0]) tasks.push({ kind: "cover", file: f.cover[0] });
  (f.gallery || []).forEach((file) => tasks.push({ kind: "gallery", file }));
  (f.documents || []).forEach((file) => tasks.push({ kind: "document", file }));
  return tasks;
}

async function runJob(job, slug, ctx) {
  const activityService = require("./activityService");
  const galleryService = require("./galleryService");
  const documentService = require("./documentService");

  for (const task of job.tasks) {
    job.current = task.file.originalname;
    try {
      if (task.kind === "cover") {
        // eslint-disable-next-line no-await-in-loop
        await activityService.setCover(slug, task.file, ctx);
      } else if (task.kind === "gallery") {
        // eslint-disable-next-line no-await-in-loop
        await galleryService.uploadForActivity(slug, [task.file], ctx);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await documentService.uploadForActivity(slug, [task.file], ctx);
      }
    } catch (err) {
      job.failed += 1;
      job.error = err.message;
      logger.error("Background upload task failed", { slug, file: task.file.originalname, error: err.message });
    }
    job.done += 1;
  }

  job.current = null;
  job.status = job.failed === 0 ? "done" : (job.failed === job.total ? "error" : "partial");
  job.finishedAt = Date.now();
  logger.info("Background upload job finished", { slug, status: job.status, done: job.done, failed: job.failed });
}

/**
 * Register + start a background upload job. Returns the job id immediately;
 * the upload runs detached (not awaited) so the caller can respond right away.
 */
function start({ user, title, slug, files, ctx }) {
  const tasks = buildTasks(files);
  if (!tasks.length) return null;
  const job = {
    id: uuid(),
    user: String(user || ""),
    title,
    slug,
    tasks,
    total: tasks.length,
    done: 0,
    failed: 0,
    current: null,
    status: "uploading",
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
  };
  jobs.set(job.id, job);
  // Detach: run without blocking the request/response cycle.
  setImmediate(() => {
    runJob(job, slug, ctx).catch((err) => {
      job.status = "error";
      job.error = err.message;
      job.finishedAt = Date.now();
      logger.error("Background upload job crashed", { slug, error: err.message });
    });
  });
  return job.id;
}

function hasFiles(files) {
  return buildTasks(files).length > 0;
}

module.exports = { start, listForUser, hasFiles };
