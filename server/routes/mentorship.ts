import { Router, Request, Response } from "express";
// @ts-ignore - db is implicitly typed from db.ts
import { db } from "../db";

// Type the db import explicitly to resolve type errors
// @ts-ignore - db is implicitly typed from db.ts
const typedDb = db as any;
import { 
  users, 
  mentorProfiles, 
  mentorshipSessions, 
  mentorAvailability, 
  mentorReviews 
} from "@shared/schema";
import { eq, and, desc, sql, count, gte, lte } from "drizzle-orm";

const router = Router();

// Simple authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Get all mentors profiles with filtering
router.get("/mentors", async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      specialization, 
      minExperience, 
      maxPrice,
      minRating,
      featured,
      search 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereConditions = [eq(mentorProfiles.isActive, true), eq(mentorProfiles.verificationStatus, 'verified')];
    
    if (specialization) {
      whereConditions.push(sql`${mentorProfiles.specializations}::jsonb @> ${JSON.stringify([specialization])}::jsonb`);
    }
    
    if (minExperience) {
      whereConditions.push(gte(mentorProfiles.experience, Number(minExperience)));
    }
    
    if (featured === 'true') {
      whereConditions.push(eq(mentorProfiles.featured, true));
    }
    
    if (search) {
      whereConditions.push(
        sql`(
          ${mentorProfiles.bio}::text ILIKE ${'%' + search + '%'} OR
          ${users.username}::text ILIKE ${'%' + search + '%'} OR
          ${users.firstName}::text ILIKE ${'%' + search + '%'} OR
          ${users.lastName}::text ILIKE ${'%' + search + '%'}
        )`
      );
    }

    // Get (mentor: any)s with pagination
    const mentors = await typedDb
      .select({
        id: mentorProfiles.id,
        bio: mentorProfiles.bio,
        specializations: mentorProfiles.specializations,
        experience: mentorProfiles.experience,
        verificationStatus: mentorProfiles.verificationStatus,
        credentials: mentorProfiles.credentials,
        stats: mentorProfiles.stats,
        pricing: mentorProfiles.pricing,
        availability: mentorProfiles.availability,
        socialProof: mentorProfiles.socialProof,
        featured: mentorProfiles.featured,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(mentorProfiles.featured), desc(mentorProfiles.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Filter by price and rating after query (since they're in JSON fields)
    let filteredMentors = mentors;
    if (maxPrice) {
      filteredMentors = filteredMentors.filter((mentor: any) => {
        const pricing = mentor.pricing as any;
        return pricing.hourlyRate <= Number(maxPrice);
      });
    }
    
    if (minRating) {
      filteredMentors = filteredMentors.filter((mentor: any) => {
        const stats = mentor.stats as any;
        return stats.rating >= Number(minRating);
      });
    }

    // Get total count for pagination
    const totalCount = await typedDb
      .select({ count: count() })
      .from(mentorProfiles)
      .where(and(...whereConditions));

    res.json({
      success: true,
      data: {
        mentors: filteredMentors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get specific mentor profile
router.get("/mentors/:mentorId", async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;

    const mentor = await typedDb
      .select({
        id: mentorProfiles.id,
        bio: mentorProfiles.bio,
        specializations: mentorProfiles.specializations,
        experience: mentorProfiles.experience,
        verificationStatus: mentorProfiles.verificationStatus,
        credentials: mentorProfiles.credentials,
        stats: mentorProfiles.stats,
        pricing: mentorProfiles.pricing,
        availability: mentorProfiles.availability,
        socialProof: mentorProfiles.socialProof,
        featured: mentorProfiles.featured,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(mentorProfiles.id, mentorId))
      .limit(1);

    if (!mentor.length) {
      return res.status(404).json({
        success: false,
        error: "Mentor not found"
      });
    }

    // Get mentor's availability slots
    const availability = await typedDb
      .select()
      .from(mentorAvailability)
      .where(and(
        eq(mentorAvailability.mentorId, mentorId),
        eq(mentorAvailability.isActive, true)
      ))
      .orderBy(mentorAvailability.dayOfWeek, mentorAvailability.startTime);

    // Get mentor's reviews
    const reviews = await typedDb
      .select({
        id: mentorReviews.id,
        rating: mentorReviews.rating,
        comment: mentorReviews.comment,
        anonymous: mentorReviews.anonymous,
        createdAt: mentorReviews.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(mentorReviews)
      .leftJoin(users, eq(mentorReviews.studentId, users.id))
      .where(eq(mentorReviews.mentorId, mentorId))
      .orderBy(desc(mentorReviews.createdAt))
      .limit(10);

    res.json({
      success: true,
      data: {
        mentor: mentor[0],
        availability,
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get (mentor: any) availability for booking
router.get("/(mentor: any)s/:mentorId/availability", async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    const { startDate, endDate } = req.query;

    const availability = await typedDb
      .select()
      .from(mentorAvailability)
      .where(and(
        eq(mentorAvailability.mentorId, mentorId),
        eq(mentorAvailability.isActive, true)
      ))
      .orderBy(mentorAvailability.dayOfWeek, mentorAvailability.startTime);

    // Get existing sessions to mark booked slots
    const existingSessions = await typedDb
      .select({
        scheduledAt: mentorshipSessions.scheduledAt,
        duration: mentorshipSessions.duration,
        status: mentorshipSessions.status
      })
      .from(mentorshipSessions)
      .where(and(
        eq(mentorshipSessions.mentorId, mentorId),
        eq(mentorshipSessions.status, 'scheduled'),
        gte(mentorshipSessions.scheduledAt, new Date(startDate as string || new Date())),
        lte(mentorshipSessions.scheduledAt, new Date(endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)))
      ));

    res.json({
      success: true,
      data: {
        availability,
        bookedSessions: existingSessions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Book (mentor: any)ship session
router.post("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { mentorId, type, title, description, scheduledAt, duration, price } = req.body;

    if (!mentorId || !title || !scheduledAt || !duration || !price) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    // Check if mentor exists and is verified
    const mentor = await typedDb
      .select()
      .from(mentorProfiles)
      .where(and(
        eq(mentorProfiles.id, mentorId),
        eq(mentorProfiles.verificationStatus, 'verified'),
        eq(mentorProfiles.isActive, true)
      ))
      .limit(1);

    if (!mentor.length) {
      return res.status(404).json({
        success: false,
        error: "Mentor not found or not verified"
      });
    }

    // Check if time slot is available
    const existingSession = await typedDb
      .select()
      .from(mentorshipSessions)
      .where(and(
        eq(mentorshipSessions.mentorId, mentorId),
        eq(mentorshipSessions.status, 'scheduled'),
        sql`ABS(EXTRACT(EPOCH FROM (${mentorshipSessions.scheduledAt} - ${scheduledAt}))::integer) < ${duration * 60}`
      ))
      .limit(1);

    if (existingSession.length) {
      return res.status(400).json({
        success: false,
        error: "Time slot is already booked"
      });
    }

    const newSession = await typedDb
      .insert(mentorshipSessions)
      .values({
        mentorId,
        studentId: req.user!.id,
        type,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: Number(duration),
        price: Number(price),
        status: 'scheduled',
        paymentStatus: 'pending'
      })
      .returning();

    res.json({
      success: true,
      data: newSession[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get user's (mentor: any)ship sessions
router.get("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { role = 'student', status, page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    
    if (role === '(mentor: any)') {
      whereConditions.push(eq(mentorshipSessions.mentorId, req.user!.id));
    } else {
      whereConditions.push(eq(mentorshipSessions.studentId, req.user!.id));
    }
    
    if (status) {
      whereConditions.push(eq(mentorshipSessions.status, status as string));
    }

    const mentorUser = alias(users, "mentorUser");
    const studentUser = alias(users, "studentUser");

    const sessions = await typedDb
      .select({
        id: mentorshipSessions.id,
        type: mentorshipSessions.type,
        title: mentorshipSessions.title,
        description: mentorshipSessions.description,
        scheduledAt: mentorshipSessions.scheduledAt,
        duration: mentorshipSessions.duration,
        status: mentorshipSessions.status,
        price: mentorshipSessions.price,
        meetingLink: mentorshipSessions.meetingLink,
        recordingUrl: mentorshipSessions.recordingUrl,
        notes: mentorshipSessions.notes,
        feedback: mentorshipSessions.feedback,
        paymentStatus: mentorshipSessions.paymentStatus,
        createdAt: mentorshipSessions.createdAt,
        mentor: {
          id: mentorUser.id,
          username: mentorUser.username,
          firstName: mentorUser.firstName,
          lastName: mentorUser.lastName
        },
        student: {
          id: studentUser.id,
          username: studentUser.username,
          firstName: studentUser.firstName,
          lastName: studentUser.lastName
        }
      })
      .from(mentorshipSessions)
      .leftJoin(mentorUser, eq(mentorshipSessions.mentorId, mentorUser.id))
      .leftJoin(studentUser, eq(mentorshipSessions.studentId, studentUser.id))
      .where(and(...whereConditions))
      .orderBy(desc(mentorshipSessions.scheduledAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    const totalCount = await typedDb
      .select({ count: count() })
      .from(mentorshipSessions)
      .where(and(...whereConditions));

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update session status (mentor only)
router.put("/sessions/:sessionId/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status, meetingLink, notes } = req.body;

    // Check if user is the mentor for this session
    const session = await typedDb
      .select()
      .from(mentorshipSessions)
      .where(eq(mentorshipSessions.id, sessionId))
      .limit(1);

    if (!session.length) {
      return res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }

    if (session[0].mentorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own sessions"
      });
    }

    const updatedSession = await typedDb
      .update(mentorshipSessions)
      .set({
        status,
        meetingLink,
        notes,
        updatedAt: new Date()
      })
      .where(eq(mentorshipSessions.id, sessionId))
      .returning();

    res.json({
      success: true,
      data: updatedSession[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Add review for mentorship session
router.post("/sessions/:sessionId/review", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment, anonymous } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5"
      });
    }

    // Check if user is the student for this session
    const session = await typedDb
      .select()
      .from(mentorshipSessions)
      .where(eq(mentorshipSessions.id, sessionId))
      .limit(1);

    if (!session.length) {
      return res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }

    if (session[0].studentId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: "You can only review sessions you attended"
      });
    }

    // Check if session is completed
    if (session[0].status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: "You can only review completed sessions"
      });
    }

    // Check if already reviewed
    const existingReview = await typedDb
      .select()
      .from(mentorReviews)
      .where(and(
        eq(mentorReviews.sessionId, sessionId),
        eq(mentorReviews.studentId, req.user!.id)
      ))
      .limit(1);

    if (existingReview.length) {
      return res.status(400).json({
        success: false,
        error: "You have already reviewed this session"
      });
    }

    const newReview = await typedDb
      .insert(mentorReviews)
      .values({
        mentorId: session[0].mentorId,
        studentId: req.user!.id,
        sessionId,
        rating: Number(rating),
        comment,
        anonymous: anonymous || false
      })
      .returning();

    // Update session feedback
    await typedDb
      .update(mentorshipSessions)
      .set({
        feedback: { rating: Number(rating), comment },
        updatedAt: new Date()
      })
      .where(eq(mentorshipSessions.id, sessionId));

    res.json({
      success: true,
      data: newReview[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create or update mentor profile
router.post("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { bio, specializations, experience, credentials, pricing, availability } = req.body;

    if (!bio || !specializations || !experience || !pricing || !availability) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    // Check if profile already exists
    const existingProfile = await typedDb
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, req.user!.id))
      .limit(1);

    if (existingProfile.length) {
      // Update existing profile
      const updatedProfile = await typedDb
        .update(mentorProfiles)
        .set({
          bio,
          specializations,
          experience: Number(experience),
          credentials,
          pricing,
          availability,
          verificationStatus: 'pending', // Reset to pending for review
          updatedAt: new Date()
        })
        .where(eq(mentorProfiles.userId, req.user!.id))
        .returning();

      res.json({
        success: true,
        data: updatedProfile[0]
      });
    } else {
      // Create new profile
      const newProfile = await typedDb
        .insert(mentorProfiles)
        .values({
          userId: req.user!.id,
          bio,
          specializations,
          experience: Number(experience),
          credentials,
          stats: { totalStudents: 0, rating: 0, totalSessions: 0 },
          pricing,
          availability,
          socialProof: { testimonials: [], caseStudies: [] }
        })
        .returning();

      res.json({
        success: true,
        data: newProfile[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
