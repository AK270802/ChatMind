import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user"), // user, coach, admin
  tradingExperience: text("trading_experience"), // beginner, intermediate, advanced, professional
  defaultPositionSize: decimal("default_position_size", { precision: 5, scale: 2 }).default("5.00"),
  riskTolerance: text("risk_tolerance").default("moderate"), // conservative, moderate, aggressive
  emailNotifications: boolean("email_notifications").default(true),
  subscriptionPlan: text("subscription_plan").default("basic"), // basic, pro, enterprise
  subscriptionStatus: text("subscription_status").default("active"), // active, cancelled, expired
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // long, short
  quantity: integer("quantity").notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 10, scale: 2 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 2 }),
  pnl: decimal("pnl", { precision: 10, scale: 2 }),
  status: text("status").default("open"), // open, closed
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date"),
  notes: text("notes"),
  strategy: text("strategy"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: uuid("coach_id").references(() => users.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  tradeId: uuid("trade_id").references(() => trades.id),
  type: text("type").notNull(), // feedback, session_notes, general
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").default("sent"), // sent, read, acknowledged
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const aiAnalysisReports = pgTable("ai_analysis_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  reportType: text("report_type").notNull(), // daily, weekly, monthly
  dateRange: jsonb("date_range").notNull(),
  insights: jsonb("insights").notNull(),
  improvements: jsonb("improvements"), // areas for improvement
  recommendations: jsonb("recommendations").notNull(),
  metrics: jsonb("metrics").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const coachStudents = pgTable("coach_students", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: uuid("coach_id").references(() => users.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  status: text("status").default("active"), // active, inactive, pending
  assignedAt: timestamp("assigned_at").default(sql`CURRENT_TIMESTAMP`)
});

// Broker Integration Tables
export const brokerConnections = pgTable("broker_connections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  brokerType: text("broker_type").notNull(), // zerodha, icicidirect, upstox, interactive_brokers
  connectionType: text("connection_type").notNull(), // api, csv, webhook
  status: text("status").default("disconnected"), // connected, disconnected, error
  credentials: jsonb("credentials"), // encrypted broker credentials
  config: jsonb("config"), // broker-specific configuration
  lastSync: timestamp("last_sync"),
  lastSyncStatus: text("last_sync_status"), // success, failed, pending
  lastSyncError: text("last_sync_error"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const brokerTrades = pgTable("broker_trades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerConnectionId: uuid("broker_connection_id").references(() => brokerConnections.id).notNull(),
  brokerTradeId: text("broker_trade_id").notNull(), // original trade ID from broker
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // long, short, buy, sell
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // open, closed, cancelled, rejected
  orderType: text("order_type"), // market, limit, stop_loss, stop_limit
  exchange: text("exchange"),
  segment: text("segment"), // equity, commodity, currency, fno
  product: text("product"), // intraday, delivery, margin
  validity: text("validity"), // day, ioc, fok
  disclosedQuantity: integer("disclosed_quantity"),
  triggerPrice: decimal("trigger_price", { precision: 10, scale: 2 }),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }),
  filledQuantity: integer("filled_quantity"),
  pendingQuantity: integer("pending_quantity"),
  cancelledQuantity: integer("cancelled_quantity"),
  orderTimestamp: timestamp("order_timestamp").notNull(),
  exchangeTimestamp: timestamp("exchange_timestamp"),
  brokerTimestamp: timestamp("broker_timestamp"),
  brokerMetadata: jsonb("broker_metadata"), // additional broker-specific data
  isSynced: boolean("is_synced").default(false), // synced to main trades table
  syncedTradeId: uuid("synced_trade_id").references(() => trades.id),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// Compliance and Security Tables
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(), // login_attempt, data_access, api_call, file_upload, data_export
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high, critical
  details: jsonb("details").notNull(),
  isAlerted: boolean("is_alerted").default(false),
  alertSentAt: timestamp("alert_sent_at"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  details: jsonb("details").notNull(),
  result: text("result").notNull(), // success, failure, error
  errorMessage: text("error_message"),
  duration: integer("duration"), // execution time in milliseconds
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const complianceReports = pgTable("compliance_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  reportType: text("report_type").notNull(), // automated, manual, scheduled
  overallScore: integer("overall_score").notNull(), // 0-100
  passed: boolean("passed").notNull(),
  violations: jsonb("violations").notNull(), // array of compliance violations
  rulesChecked: jsonb("rules_checked").notNull(), // array of rules with their status
  recommendations: jsonb("recommendations").notNull(),
  dataScope: jsonb("data_scope").notNull(), // what data was checked
  generatedBy: text("generated_by").notNull(), // system, admin, user
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// Social and Gamification Tables
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  achievementType: text("achievement_type").notNull(), // trade_milestone, consistency, profit_target, risk_management
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  badgeColor: text("badge_color").default("#3B82F6"),
  criteria: jsonb("criteria").notNull(), // what was required to earn this
  progress: jsonb("progress").notNull(), // progress towards achievement
  earnedAt: timestamp("earned_at").default(sql`CURRENT_TIMESTAMP`),
  isNotified: boolean("is_notified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const leaderboards = pgTable("leaderboards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // profit, win_rate, consistency, risk_adjusted
  timeframe: text("timeframe").notNull(), // daily, weekly, monthly, all_time
  isActive: boolean("is_active").default(true),
  criteria: jsonb("criteria").notNull(), // scoring criteria
  resetSchedule: text("reset_schedule"), // cron expression for reset
  lastResetAt: timestamp("last_reset_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leaderboardId: uuid("leaderboard_id").references(() => leaderboards.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  rank: integer("rank").notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(),
  metrics: jsonb("metrics").notNull(), // detailed metrics for this entry
  previousRank: integer("previous_rank"),
  change: integer("change"), // rank change from previous period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // trade_update, achievement, insight, question
  tradeId: uuid("trade_id").references(() => trades.id),
  achievementId: uuid("achievement_id").references(() => userAchievements.id),
  isPublic: boolean("is_public").default(true),
  isPinned: boolean("is_pinned").default(false),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// Define postInteractions table without self-reference first
export const postInteractions = pgTable("post_interactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").references(() => socialPosts.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // like, comment, share
  content: text("content"), // for comments
  parentInteractionId: uuid("parent_interaction_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// Trade Stories
export const tradeStories = pgTable("trade_stories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tradeData: jsonb("trade_data").notNull(), // detailed trade information
  insights: jsonb("insights").notNull(), // key learnings, emotional state, etc.
  isAnonymous: boolean("is_anonymous").default(false),
  isVerified: boolean("is_verified").default(false),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  views: integer("views").default(0),
  tags: jsonb("tags"),
  status: text("status").default("published"), // draft, published, archived
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// Trade Story Comments
// Define tradeStoryComments table without self-reference first
export const tradeStoryComments = pgTable("trade_story_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: uuid("story_id").references(() => tradeStories.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: uuid("parent_comment_id"),
  likes: integer("likes").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// Trade Story Likes
export const tradeStoryLikes = pgTable("trade_story_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: uuid("story_id").references(() => tradeStories.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  uniqueStoryUser: unique("unique_story_user").on(table.storyId, table.userId)
}));

// Badges System
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon identifier
  category: text("category").notNull(), // trading, consistency, skill, social, indian
  rarity: text("rarity").notNull(), // common, rare, epic, legendary
  requirements: jsonb("requirements").notNull(), // achievement criteria
  points: integer("points").notNull().default(10),
  isActive: boolean("is_active").default(true),
  imageUrl: text("image_url"), // custom badge image
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// User Badges (earned badges)
export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  progress: jsonb("progress").notNull(), // current progress towards badge
  earnedAt: timestamp("earned_at"),
  isNotified: boolean("is_notified").default(false),
  isDisplayed: boolean("is_displayed").default(true)
}, (table) => ({
  uniqueUserBadge: unique("unique_user_badge").on(table.userId, table.badgeId)
}));

// Mentor Marketplace
export const mentorProfiles = pgTable("mentor_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  bio: text("bio").notNull(),
  specializations: jsonb("specializations").notNull(), // array of specializations
  experience: integer("experience").notNull(), // years of experience
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  credentials: jsonb("credentials").notNull(), // SEBI registration, certifications, etc.
  stats: jsonb("stats").notNull(), // total students, rating, etc.
  pricing: jsonb("pricing").notNull(), // hourly rate, package discounts
  availability: jsonb("availability").notNull(), // time slots, timezone
  socialProof: jsonb("social_proof").notNull(), // testimonials, case studies
  isActive: boolean("is_active").default(true),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// Mentorship Sessions
export const mentorshipSessions = pgTable("mentorship_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: uuid("mentor_id").references(() => mentorProfiles.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // one_on_one, group, workshop
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // minutes
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  meetingLink: text("meeting_link"), // Zoom/Google Meet link
  recordingUrl: text("recording_url"),
  notes: text("notes"),
  feedback: jsonb("feedback"), // rating and comment
  paymentStatus: text("payment_status").default("pending"), // pending, paid, refunded
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// Mentor Availability Slots
export const mentorAvailability = pgTable("mentor_availability", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: uuid("mentor_id").references(() => mentorProfiles.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:mm format
  endTime: text("end_time").notNull(), // HH:mm format
  isRecurring: boolean("is_recurring").default(true),
  timezone: text("timezone").default("Asia/Kolkata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// Mentor Reviews
export const mentorReviews = pgTable("mentor_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: uuid("mentor_id").references(() => mentorProfiles.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  sessionId: uuid("session_id").references(() => mentorshipSessions.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  anonymous: boolean("anonymous").default(false),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  uniqueMentorStudentSession: unique("unique_mentor_student_session").on(table.mentorId, table.studentId, table.sessionId)
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  trades: many(trades),
  feedbackGiven: many(feedback, { relationName: "coachFeedback" }),
  feedbackReceived: many(feedback, { relationName: "studentFeedback" }),
  analysisReports: many(aiAnalysisReports),
  coachingStudents: many(coachStudents, { relationName: "coach" }),
  studentCoaches: many(coachStudents, { relationName: "student" }),
  brokerConnections: many(brokerConnections),
  securityEvents: many(securityEvents),
  auditLogs: many(auditLogs),
  complianceReports: many(complianceReports),
  achievements: many(userAchievements),
  leaderboardEntries: many(leaderboardEntries),
  socialPosts: many(socialPosts),
  postInteractions: many(postInteractions),
  tradeStories: many(tradeStories),
  tradeStoryComments: many(tradeStoryComments),
  tradeStoryLikes: many(tradeStoryLikes),
  userBadges: many(userBadges),
  mentorProfile: one(mentorProfiles),
  mentorshipSessionsAsStudent: many(mentorshipSessions, { relationName: "student" }),
  mentorReviews: many(mentorReviews)
}));

export const tradesRelations = relations(trades, ({ one, many }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id]
  }),
  feedback: many(feedback)
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  coach: one(users, {
    fields: [feedback.coachId],
    references: [users.id],
    relationName: "coachFeedback"
  }),
  student: one(users, {
    fields: [feedback.studentId],
    references: [users.id],
    relationName: "studentFeedback"
  }),
  trade: one(trades, {
    fields: [feedback.tradeId],
    references: [trades.id]
  })
}));

export const aiAnalysisReportsRelations = relations(aiAnalysisReports, ({ one }) => ({
  user: one(users, {
    fields: [aiAnalysisReports.userId],
    references: [users.id]
  })
}));

export const coachStudentsRelations = relations(coachStudents, ({ one }) => ({
  coach: one(users, {
    fields: [coachStudents.coachId],
    references: [users.id],
    relationName: "coach"
  }),
  student: one(users, {
    fields: [coachStudents.studentId],
    references: [users.id],
    relationName: "student"
  })
}));

// Broker Integration Relations
export const brokerConnectionsRelations = relations(brokerConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [brokerConnections.userId],
    references: [users.id]
  }),
  brokerTrades: many(brokerTrades)
}));

export const brokerTradesRelations = relations(brokerTrades, ({ one }) => ({
  brokerConnection: one(brokerConnections, {
    fields: [brokerTrades.brokerConnectionId],
    references: [brokerConnections.id]
  }),
  syncedTrade: one(trades, {
    fields: [brokerTrades.syncedTradeId],
    references: [trades.id]
  })
}));

// Compliance and Security Relations
export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id]
  })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}));

export const complianceReportsRelations = relations(complianceReports, ({ one }) => ({
  user: one(users, {
    fields: [complianceReports.userId],
    references: [users.id]
  })
}));

// Social and Gamification Relations
export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  })
}));

export const leaderboardsRelations = relations(leaderboards, ({ many }) => ({
  entries: many(leaderboardEntries)
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  leaderboard: one(leaderboards, {
    fields: [leaderboardEntries.leaderboardId],
    references: [leaderboards.id]
  }),
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id]
  })
}));

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id]
  }),
  trade: one(trades, {
    fields: [socialPosts.tradeId],
    references: [trades.id]
  }),
  achievement: one(userAchievements, {
    fields: [socialPosts.achievementId],
    references: [userAchievements.id]
  }),
  interactions: many(postInteractions)
}));

export const postInteractionsRelations = relations(postInteractions, ({ one }) => ({
  post: one(socialPosts, {
    fields: [postInteractions.postId],
    references: [socialPosts.id]
  }),
  user: one(users, {
    fields: [postInteractions.userId],
    references: [users.id]
  })
}));

// Trade Stories Relations
export const tradeStoriesRelations = relations(tradeStories, ({ one, many }) => ({
  user: one(users, {
    fields: [tradeStories.userId],
    references: [users.id]
  }),
  comments: many(tradeStoryComments),
  likes: many(tradeStoryLikes)
}));

export const tradeStoryCommentsRelations = relations(tradeStoryComments, ({ one }) => ({
  story: one(tradeStories, {
    fields: [tradeStoryComments.storyId],
    references: [tradeStories.id]
  }),
  user: one(users, {
    fields: [tradeStoryComments.userId],
    references: [users.id]
  })
}));

export const tradeStoryLikesRelations = relations(tradeStoryLikes, ({ one }) => ({
  story: one(tradeStories, {
    fields: [tradeStoryLikes.storyId],
    references: [tradeStories.id]
  }),
  user: one(users, {
    fields: [tradeStoryLikes.userId],
    references: [users.id]
  })
}));

// Badges Relations
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges)
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id]
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id]
  })
}));

// Mentor Marketplace Relations
export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id]
  }),
  mentorshipSessions: many(mentorshipSessions),
  availabilitySlots: many(mentorAvailability),
  reviews: many(mentorReviews)
}));

export const mentorshipSessionsRelations = relations(mentorshipSessions, ({ one }) => ({
  mentor: one(mentorProfiles, {
    fields: [mentorshipSessions.mentorId],
    references: [mentorProfiles.id]
  }),
  student: one(users, {
    fields: [mentorshipSessions.studentId],
    references: [users.id],
    relationName: "student"
  }),
  review: one(mentorReviews, {
    fields: [mentorshipSessions.id],
    references: [mentorReviews.sessionId]
  })
}));

export const mentorAvailabilityRelations = relations(mentorAvailability, ({ one }) => ({
  mentor: one(mentorProfiles, {
    fields: [mentorAvailability.mentorId],
    references: [mentorProfiles.id]
  })
}));

export const mentorReviewsRelations = relations(mentorReviews, ({ one }) => ({
  mentor: one(mentorProfiles, {
    fields: [mentorReviews.mentorId],
    references: [mentorProfiles.id]
  }),
  student: one(users, {
    fields: [mentorReviews.studentId],
    references: [users.id]
  }),
  session: one(mentorshipSessions, {
    fields: [mentorReviews.sessionId],
    references: [mentorshipSessions.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true
});

export const insertAiAnalysisReportSchema = createInsertSchema(aiAnalysisReports).omit({
  id: true,
  createdAt: true
});

export const insertCoachStudentSchema = createInsertSchema(coachStudents).omit({
  id: true,
  assignedAt: true
});

// Broker Integration Insert Schemas
export const insertBrokerConnectionSchema = createInsertSchema(brokerConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBrokerTradeSchema = createInsertSchema(brokerTrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Compliance and Security Insert Schemas
export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  createdAt: true
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({
  id: true,
  createdAt: true
});

// Social and Gamification Insert Schemas
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true
});

export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPostInteractionSchema = createInsertSchema(postInteractions).omit({
  id: true,
  createdAt: true
});

// Trade Stories Insert Schemas
export const insertTradeStorySchema = createInsertSchema(tradeStories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTradeStoryCommentSchema = createInsertSchema(tradeStoryComments).omit({
  id: true,
  createdAt: true
});

export const insertTradeStoryLikeSchema = createInsertSchema(tradeStoryLikes).omit({
  id: true,
  createdAt: true
});

// Badges Insert Schemas
export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true
});

// Mentor Marketplace Insert Schemas
export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMentorshipSessionSchema = createInsertSchema(mentorshipSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMentorAvailabilitySchema = createInsertSchema(mentorAvailability).omit({
  id: true,
  createdAt: true
});

export const insertMentorReviewSchema = createInsertSchema(mentorReviews).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertAiAnalysisReport = z.infer<typeof insertAiAnalysisReportSchema>;
export type AiAnalysisReport = typeof aiAnalysisReports.$inferSelect;
export type InsertCoachStudent = z.infer<typeof insertCoachStudentSchema>;
export type CoachStudent = typeof coachStudents.$inferSelect;

// Broker Integration Types
export type InsertBrokerConnection = z.infer<typeof insertBrokerConnectionSchema>;
export type BrokerConnection = typeof brokerConnections.$inferSelect;
export type InsertBrokerTrade = z.infer<typeof insertBrokerTradeSchema>;
export type BrokerTrade = typeof brokerTrades.$inferSelect;

// Compliance and Security Types
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;

// Social and Gamification Types
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertPostInteraction = z.infer<typeof insertPostInteractionSchema>;
export type PostInteraction = typeof postInteractions.$inferSelect;

// Trade Stories Types
export type InsertTradeStory = z.infer<typeof insertTradeStorySchema>;
export type TradeStory = typeof tradeStories.$inferSelect;
export type InsertTradeStoryComment = z.infer<typeof insertTradeStoryCommentSchema>;
export type TradeStoryComment = typeof tradeStoryComments.$inferSelect;
export type InsertTradeStoryLike = z.infer<typeof insertTradeStoryLikeSchema>;
export type TradeStoryLike = typeof tradeStoryLikes.$inferSelect;

// Badges Types
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Mentor Marketplace Types
export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;
export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type InsertMentorshipSession = z.infer<typeof insertMentorshipSessionSchema>;
export type MentorshipSession = typeof mentorshipSessions.$inferSelect;
export type InsertMentorAvailability = z.infer<typeof insertMentorAvailabilitySchema>;
export type MentorAvailability = typeof mentorAvailability.$inferSelect;
export type InsertMentorReview = z.infer<typeof insertMentorReviewSchema>;
export type MentorReview = typeof mentorReviews.$inferSelect;

// Additional schemas for API endpoints
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = insertUserSchema.pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true
}).extend({
  password: z.string().min(6)
});

export const tradeUploadSchema = z.object({
  trades: z.array(insertTradeSchema.omit({ userId: true }))
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type TradeUploadData = z.infer<typeof tradeUploadSchema>;
