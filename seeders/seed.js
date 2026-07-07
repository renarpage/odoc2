/**
 * Idempotent database seeder.
 * Seeds: default admin accounts, branding + system settings, and the 8 sample
 * activities that previously lived in the in-memory store. Safe to re-run.
 *
 *   npm run seed
 */
require("dotenv").config();
const { connectDB, disconnectDB } = require("../config/db");
const logger = require("../config/logger");
const env = require("../config/env");
const User = require("../models/User");
const Activity = require("../models/Activity");
const Setting = require("../models/Setting");
const authService = require("../services/authService");
const { ROLES } = require("../constants");
const { DEFAULT_SETTINGS } = require("../helpers/serializers");

const ACTIVITIES = [
  {
    slug: "act-smavo-2024", title: "SMAVO Music Festival 2024", category: "Festival", status: "Completed",
    date: "2024-10-12", location: "Central Park Amphitheater",
    cover: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?q=80&w=1200",
    summary: "The biggest annual music celebration featuring talented student bands and special guest performances.",
    description: [
      "The SMAVO Music Festival 2024 marked a significant milestone in our annual cultural calendar, bringing together over 15,000 attendees for a day of diverse musical performances, interactive art installations, and community engagement.",
      "This year's focus was on sustainability and emerging local talent, featuring a main stage powered entirely by renewable energy sources and a secondary stage dedicated exclusively to independent artists from the surrounding region."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?q=80&w=800",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=800",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800",
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800"
    ],
    documents: [
      { name: "Event Proposal.pdf", size: "2.4 MB", type: "pdf" },
      { name: "Final Report.pdf", size: "5.1 MB", type: "pdf" },
      { name: "Budgeting_Q4.xlsx", size: "1.1 MB", type: "xlsx" }
    ],
    committee: [
      { name: "Sarah Jenkins", role: "Project Director" },
      { name: "David Chen", role: "Operations Lead" },
      { name: "Elena Rodriguez", role: "Finance Coordinator" }
    ],
    milestones: [
      { title: "Planning Phase Initiated", date: "March 15, 2024", done: true },
      { title: "Vendor Contracts Finalized", date: "June 10, 2024", done: true },
      { title: "Marketing Campaign Launch", date: "August 01, 2024", done: true },
      { title: "Event Execution", date: "October 12, 2024", done: true, current: true }
    ],
    attendeeAvatarCount: 24
  },
  {
    slug: "act-elibrary", title: "E-Library Launch", category: "Technology", status: "Ongoing",
    date: "2024-10-01", location: "Main Campus Library",
    cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200",
    summary: "Rolling out the new digital library system for all students to access archives with one click.",
    description: [
      "The E-Library initiative digitizes the school's entire physical catalogue and pairs it with a modern search experience, letting students and faculty reach any resource instantly from any device.",
      "The rollout is phased: reading rooms first, then remote access, then integration with the OSIS SMAVO single sign-on."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800"
    ],
    documents: [{ name: "Rollout_Plan.pdf", size: "1.2 MB", type: "pdf" }],
    committee: [
      { name: "Michael Tan", role: "Systems Lead" },
      { name: "Priya Nair", role: "Content Curator" }
    ],
    milestones: [
      { title: "System Procurement", date: "July 20, 2024", done: true },
      { title: "Catalogue Migration", date: "September 05, 2024", done: true },
      { title: "Reading Room Pilot", date: "October 01, 2024", done: true, current: true },
      { title: "Full Campus Rollout", date: "December 01, 2024", done: false }
    ],
    attendeeAvatarCount: 2
  },
  {
    slug: "act-election", title: "OSIS Leadership Election", category: "Organization", status: "Upcoming",
    date: "2024-11-20", location: "Main Auditorium",
    cover: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200",
    summary: "The annual democratic process to choose the next generation of SMAVO student leaders.",
    description: [
      "Every year, OSIS SMAVO holds an open election so students can choose the leadership team that will represent them for the following academic year.",
      "Registration is currently open to all eligible candidates; campaigning begins two weeks before the vote."
    ],
    gallery: [
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800",
      "https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=800"
    ],
    documents: [{ name: "Election_Guidelines.pdf", size: "890 KB", type: "pdf" }],
    committee: [
      { name: "Amelia Cruz", role: "Election Commissioner" },
      { name: "Ben Wattson", role: "Logistics" }
    ],
    milestones: [
      { title: "Registration Opens", date: "October 15, 2024", done: true, current: true },
      { title: "Campaign Period", date: "November 05, 2024", done: false },
      { title: "Voting Day", date: "November 20, 2024", done: false }
    ],
    attendeeAvatarCount: 0
  },
  {
    slug: "act-mainframe", title: "Mainframe Archival Q4", category: "Archival", status: "Ongoing",
    date: "2024-10-24", location: "Server Room B",
    cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200",
    summary: "Quarterly archival sweep of mainframe records into the ODOC digital vault.",
    description: ["A scheduled quarterly job that migrates cold records from the mainframe into the ODOC long-term archive, freeing primary storage while keeping records retrievable."],
    gallery: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800"],
    documents: [], committee: [{ name: "IT Operations", role: "Owner" }],
    milestones: [
      { title: "Scope Locked", date: "October 01, 2024", done: true },
      { title: "Migration Running", date: "October 24, 2024", done: true, current: true }
    ],
    attendeeAvatarCount: 0
  },
  {
    slug: "act-security", title: "Weekly Security Sweep", category: "Security Scan", status: "Completed",
    date: "2024-10-22", location: "All Systems",
    cover: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200",
    summary: "Routine automated vulnerability and integrity scan across all ODOC systems.",
    description: ["Weekly automated scan covering access logs, dependency vulnerabilities, and file-integrity checks."],
    gallery: ["https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800"],
    documents: [{ name: "Scan_Report_Oct22.pdf", size: "640 KB", type: "pdf" }],
    committee: [{ name: "IT Security", role: "Owner" }],
    milestones: [{ title: "Scan Completed", date: "October 22, 2024", done: true, current: true }],
    attendeeAvatarCount: 0
  },
  {
    slug: "act-robotics", title: "Robotics Workshop", category: "Technology", status: "Completed",
    date: "2024-10-10", location: "STEM Lab",
    cover: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200",
    summary: "Hands-on robotics workshop introducing students to microcontrollers and sensors.",
    description: ["A two-day hands-on workshop where students built and programmed simple robots using microcontrollers."],
    gallery: ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800"],
    documents: [], committee: [{ name: "Mr. Yusuf", role: "Facilitator" }],
    milestones: [{ title: "Workshop Held", date: "October 10, 2024", done: true, current: true }],
    attendeeAvatarCount: 12
  },
  {
    slug: "act-sportleague", title: "Internal Sport League", category: "Sports", status: "Completed",
    date: "2024-09-28", location: "School Gymnasium",
    cover: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200",
    summary: "Semester-long inter-class sports league covering basketball, futsal and badminton.",
    description: ["A semester-long internal league across three sports, culminating in a finals day."],
    gallery: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800"],
    documents: [], committee: [{ name: "Sports Committee", role: "Owner" }],
    milestones: [{ title: "Finals Day", date: "September 28, 2024", done: true, current: true }],
    attendeeAvatarCount: 40
  },
  {
    slug: "act-leadership-camp", title: "Youth Leadership Camp", category: "Organization", status: "Completed",
    date: "2024-09-20", location: "Bogor Retreat Center",
    cover: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200",
    summary: "A weekend retreat developing the next generation of student leaders.",
    description: ["A weekend retreat mixing workshops, team challenges, and reflection sessions for incoming student leaders."],
    gallery: ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800"],
    documents: [], committee: [{ name: "OSIS Advisors", role: "Owner" }],
    milestones: [{ title: "Camp Completed", date: "September 20, 2024", done: true, current: true }],
    attendeeAvatarCount: 30
  }
];

async function seedAdmins() {
  const accounts = [
    { name: "Super Admin", email: env.SEED_SUPERADMIN_EMAIL, password: env.SEED_SUPERADMIN_PASSWORD, role: ROLES.SUPER_ADMIN },
    { name: "Standard Admin", email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD, role: ROLES.STANDARD_ADMIN }
  ];
  for (const acc of accounts) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await User.findOne({ email: acc.email.toLowerCase() });
    if (existing) {
      logger.info(`Admin already present: ${acc.email}`);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const passwordHash = await authService.hashPassword(acc.password);
    // eslint-disable-next-line no-await-in-loop
    await User.create({ name: acc.name, email: acc.email, passwordHash, role: acc.role, mustChangePassword: true });
    logger.info(`Seeded admin: ${acc.email} (${acc.role})`);
  }
}

async function seedSettings() {
  const branding = {
    primaryColor: "#3155E7", secondaryColor: "#4E5A98",
    tagline: "One Door One Click",
    heroTitle: "Secure, accessible, and intelligent digital archiving at your fingertips.",
    logoUrl: null, heroImageUrl: null
  };
  const system = {
    ...DEFAULT_SETTINGS,
    smtpHost: "smtp.gmail.com", smtpPort: 587, systemEmail: "no-reply@odoc.archive",
    storageCapacityGB: 1024
  };
  await Setting.findOneAndUpdate({ key: "branding" }, { $setOnInsert: { data: branding } }, { upsert: true, setDefaultsOnInsert: true });
  await Setting.findOneAndUpdate({ key: "system" }, { $setOnInsert: { data: system } }, { upsert: true, setDefaultsOnInsert: true });
  logger.info("Seeded branding + system settings");
}

async function seedActivities() {
  for (const a of ACTIVITIES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Activity.findOne({ slug: a.slug });
    if (existing) continue;
    // eslint-disable-next-line no-await-in-loop
    await Activity.create({ ...a, date: new Date(a.date), visibility: "public" });
    logger.info(`Seeded activity: ${a.slug}`);
  }
}

async function run() {
  await connectDB();
  await seedAdmins();
  await seedSettings();
  await seedActivities();
  logger.info("Seeding complete");
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error("Seeding failed", { error: err.message, stack: err.stack });
  process.exit(1);
});
