//==============================================================//
//  SERVICE — Background media uploads (MongoDB-backed)         //
//  On activity create/edit with files, the record is saved     //
//  immediately; the actual Drive uploads run here and update a  //
//  persisted job doc the dashboard polls via listForUser.       //
//                                                              //
//  Execution mode:                                            //
//    long-running host  -> detached (setImmediate), instant UX  //
//    serverless         -> inline (awaited), since a detached    //
//                          task would be killed after response  //
//==============================================================//
const env = require("../config/env");
const logger = require("../config/logger");
const uploadJobRepository = require("../repositories/uploadJobRepository");

// Lazy requires inside the runner avoid load-order cycles with activityService.

function publicShape(job) {
  return {
    id: String(job._id),
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

async function listForUser(userId) {
  if (!userId) return [];
  const docs = await uploadJobRepository.listForUser(userId);
  return docs.map(publicShape);
}

function buildTasks(files) {
  const f = files || {};
  const tasks = [];
  if (f.cover && f.cover[0]) tasks.push({ kind: "cover", file: f.cover[0] });
  (f.gallery || []).forEach((file) => tasks.push({ kind: "gallery", file }));
  (f.documents || []).forEach((file) => tasks.push({ kind: "document", file }));
  return tasks;
}

// Save current progress, ignoring transient write errors.
async function persist(job) {
  try {
    await job.save();
  } catch (err) {
    logger.warn("Upload job save failed", { id: String(job._id), error: err.message });
  }
}

async function runJob(job, tasks, slug, ctx) {
  const activityService = require("./activityService");
  const galleryService = require("./galleryService");
  const documentService = require("./documentService");

  for (const task of tasks) {
    job.current = task.file.originalname;
    await persist(job);
    try {
      if (task.kind === "cover") {
        await activityService.setCover(slug, task.file, ctx);
      } else if (task.kind === "gallery") {
        await galleryService.uploadForActivity(slug, [task.file], ctx);
      } else {
        await documentService.uploadForActivity(slug, [task.file], ctx);
      }
    } catch (err) {
      job.failed += 1;
      job.error = err.message;
      logger.error("Background upload task failed", { slug, file: task.file.originalname, error: err.message });
    }
    job.done += 1;
    await persist(job);
  }

  job.current = null;
  job.status = job.failed === 0 ? "done" : job.failed === job.total ? "error" : "partial";
  job.finishedAt = new Date();
  await persist(job);
  logger.info("Background upload job finished", { slug, status: job.status, done: job.done, failed: job.failed });
}

// Register + start an upload job. Returns the job id.
// Detached on a long-running host; awaited inline on serverless.
async function start({ user, title, slug, files, ctx }) {
  try {
    const tasks = buildTasks(files);
    if (!tasks.length) return null;
    const job = await uploadJobRepository.create({
      user,
      title,
      slug,
      total: tasks.length,
      done: 0,
      failed: 0,
      status: "uploading",
    });

    if (env.SERVERLESS) {
      // Must finish before the function returns, or it gets killed.
      await runJob(job, tasks, slug, ctx).catch(async (err) => {
        job.status = "error";
        job.error = err.message;
        job.finishedAt = new Date();
        await persist(job);
        logger.error("Upload job crashed", { slug, error: err.message });
      });
    } else {
      // Detach so the request can respond immediately.
      setImmediate(() => {
        runJob(job, tasks, slug, ctx).catch(async (err) => {
          job.status = "error";
          job.error = err.message;
          job.finishedAt = new Date();
          await persist(job);
          logger.error("Background upload job crashed", { slug, error: err.message });
        });
      });
    }
    return String(job._id);
  } catch (err) {
    logger.error("Failed to start upload job", { slug, error: err.message });
    return null;
  }
}

function hasFiles(files) {
  return buildTasks(files).length > 0;
}

module.exports = { start, listForUser, hasFiles };
