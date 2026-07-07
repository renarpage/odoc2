/**
 * In-memory data store standing in for a real database.
 * Everything the guest site and the admin panel reads/writes lives here.
 */
const { v4: uuid } = require("uuid");

const activities = [
  {
    id: "act-smavo-2024",
    title: "SMAVO Music Festival 2024",
    category: "Festival",
    status: "Completed",
    date: "2024-10-12",
    location: "Central Park Amphitheater",
    cover: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?q=80&w=1200",
    summary:
      "The biggest annual music celebration featuring talented student bands and special guest performances.",
    description: [
      "The SMAVO Music Festival 2024 marked a significant milestone in our annual cultural calendar, bringing together over 15,000 attendees for a day of diverse musical performances, interactive art installations, and community engagement.",
      "This year's focus was on sustainability and emerging local talent, featuring a main stage powered entirely by renewable energy sources and a secondary stage dedicated exclusively to independent artists from the surrounding region. The event successfully met all core objectives, including a 20% increase in attendance from the previous year and zero-waste initiatives that diverted 90% of waste from landfills."
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
    attendeeAvatarCount: 24,
    createdAt: "2024-10-24"
  },
  {
    id: "act-elibrary",
    title: "E-Library Launch",
    category: "Technology",
    status: "Ongoing",
    date: "2024-10-01",
    location: "Main Campus Library",
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
    attendeeAvatarCount: 2,
    createdAt: "2024-10-10"
  },
  {
    id: "act-election",
    title: "OSIS Leadership Election",
    category: "Organization",
    status: "Upcoming",
    date: "2024-11-20",
    location: "Main Auditorium",
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
    attendeeAvatarCount: 0,
    createdAt: "2024-09-20"
  },
  {
    id: "act-mainframe",
    title: "Mainframe Archival Q4",
    category: "Archival",
    status: "Ongoing",
    date: "2024-10-24",
    location: "Server Room B",
    cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200",
    summary: "Quarterly archival sweep of mainframe records into the ODOC digital vault.",
    description: [
      "A scheduled quarterly job that migrates cold records from the mainframe into the ODOC long-term archive, freeing primary storage while keeping records retrievable."
    ],
    gallery: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800"],
    documents: [],
    committee: [{ name: "IT Operations", role: "Owner" }],
    milestones: [
      { title: "Scope Locked", date: "October 01, 2024", done: true },
      { title: "Migration Running", date: "October 24, 2024", done: true, current: true }
    ],
    attendeeAvatarCount: 0,
    createdAt: "2024-10-24"
  },
  {
    id: "act-security",
    title: "Weekly Security Sweep",
    category: "Security Scan",
    status: "Completed",
    date: "2024-10-22",
    location: "All Systems",
    cover: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200",
    summary: "Routine automated vulnerability and integrity scan across all ODOC systems.",
    description: ["Weekly automated scan covering access logs, dependency vulnerabilities, and file-integrity checks."],
    gallery: ["https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800"],
    documents: [{ name: "Scan_Report_Oct22.pdf", size: "640 KB", type: "pdf" }],
    committee: [{ name: "IT Security", role: "Owner" }],
    milestones: [{ title: "Scan Completed", date: "October 22, 2024", done: true, current: true }],
    attendeeAvatarCount: 0,
    createdAt: "2024-10-22"
  },
  {
    id: "act-robotics",
    title: "Robotics Workshop",
    category: "Technology",
    status: "Completed",
    date: "2024-10-10",
    location: "STEM Lab",
    cover: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200",
    summary: "Hands-on robotics workshop introducing students to microcontrollers and sensors.",
    description: ["A two-day hands-on workshop where students built and programmed simple robots using microcontrollers."],
    gallery: ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800"],
    documents: [],
    committee: [{ name: "Mr. Yusuf", role: "Facilitator" }],
    milestones: [{ title: "Workshop Held", date: "October 10, 2024", done: true, current: true }],
    attendeeAvatarCount: 12,
    createdAt: "2024-10-10"
  },
  {
    id: "act-sportleague",
    title: "Internal Sport League",
    category: "Sports",
    status: "Completed",
    date: "2024-09-28",
    location: "School Gymnasium",
    cover: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200",
    summary: "Semester-long inter-class sports league covering basketball, futsal and badminton.",
    description: ["A semester-long internal league across three sports, culminating in a finals day."],
    gallery: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800"],
    documents: [],
    committee: [{ name: "Sports Committee", role: "Owner" }],
    milestones: [{ title: "Finals Day", date: "September 28, 2024", done: true, current: true }],
    attendeeAvatarCount: 40,
    createdAt: "2024-09-28"
  },
  {
    id: "act-leadership-camp",
    title: "Youth Leadership Camp",
    category: "Organization",
    status: "Completed",
    date: "2024-09-20",
    location: "Bogor Retreat Center",
    cover: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200",
    summary: "A weekend retreat developing the next generation of student leaders.",
    description: ["A weekend retreat mixing workshops, team challenges, and reflection sessions for incoming student leaders."],
    gallery: ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800"],
    documents: [],
    committee: [{ name: "OSIS Advisors", role: "Owner" }],
    milestones: [{ title: "Camp Completed", date: "September 20, 2024", done: true, current: true }],
    attendeeAvatarCount: 30,
    createdAt: "2024-09-20"
  }
];

const systemLogs = [
  { type: "warning", title: "API Sync Failure", detail: "GDrive API returned 403 Forbidden at 14:22" },
  { type: "info", title: "System Update", detail: "Version 2.4.1 deployed successfully" },
  { type: "user", title: "New User Registered", detail: "User 'smavo_stud_42' joined the platform" }
];

const recentUploads = [
  { name: "Product_Catalog_Final.jpg", type: "Image", size: "4.2 MB", date: "Today, 10:24 AM" },
  { name: "Marketing_Campaign_2024.mp4", type: "Video", size: "452.8 MB", date: "Yesterday" },
  { name: "Q3_Financial_Summary.pdf", type: "Document", size: "1.8 MB", date: "Oct 24, 2024" }
];

const branding = {
  primaryColor: "#3155E7",
  secondaryColor: "#4E5A98",
  tagline: "One Door One Click",
  heroTitle: "Secure, accessible, and intelligent digital archiving at your fingertips."
};

const settings = {
  platformName: "ODOC Digital Archive",
  maintenanceMode: false,
  timezone: "(GMT-08:00) Pacific Time (US & Canada)",
  emailAlerts: true,
  systemLogsNotif: true,
  errorReporting: false,
  twoFactorAuth: true,
  passwordPolicy: "Strong (Alpha-numeric + Special)",
  sessionTimeout: 30,
  gdriveConnected: true,
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  systemEmail: "no-reply@odoc.archive"
};

function findActivity(id) {
  return activities.find((a) => a.id === id);
}

function addActivity(payload) {
  const newActivity = {
    id: "act-" + uuid().slice(0, 8),
    title: payload.title,
    category: payload.category,
    status: "Ongoing",
    date: payload.date,
    location: payload.location || "TBA",
    cover:
      payload.cover ||
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200",
    summary: payload.description ? payload.description.slice(0, 140) : "",
    description: payload.description ? [payload.description] : [],
    gallery: [],
    documents: [],
    committee: [],
    milestones: [{ title: "Planning Phase Initiated", date: payload.date, done: true, current: true }],
    attendeeAvatarCount: 0,
    createdAt: new Date().toISOString().slice(0, 10)
  };
  activities.unshift(newActivity);
  return newActivity;
}

function stats() {
  return {
    totalActivities: activities.length,
    totalGrowth: "+12%",
    ongoingNow: activities.filter((a) => a.status === "Ongoing").length,
    completedToday: activities.filter((a) => a.status === "Completed").length,
    dataArchivedTB: "8.4",
    storageUsedGB: 84.2,
    storageCapacityGB: 1024,
    totalUsers: "46",
    trafficPeak: "3,400 concurrent",
    activeEvents: activities.filter((a) => a.status === "Ongoing" || a.status === "Upcoming").length,
    ongoingCount: activities.filter((a) => a.status === "Ongoing").length,
    upcomingCount: activities.filter((a) => a.status === "Upcoming").length
  };
}

module.exports = {
  activities,
  systemLogs,
  recentUploads,
  branding,
  settings,
  findActivity,
  addActivity,
  stats
};
