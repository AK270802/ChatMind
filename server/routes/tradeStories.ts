import { Router, Request, Response } from "express";
import { db } from "../db";
import { drizzle } from "drizzle-orm/node-postgres";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";
import { 
  users, 
  trades, 
  tradeStories, 
  tradeStoryComments, 
  tradeStoryLikes 
} from "@shared/schema";

// Type the db import properly
const typedDb = db as any;
import { eq, and, desc, sql, count, or, ilike } from "drizzle-orm";
import { requireAuth } from "../middleware";

const router = Router();

// Get all trade stories with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      tag, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      userId,
      isVerified 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereConditions = [eq(tradeStories.status, 'published')];
    
    if (tag) {
      whereConditions.push(sql`${tradeStories.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`);
    }
    
    if (search) {
      const searchCondition = or(
        ilike(tradeStories.title, `%${search}%`),
        ilike(tradeStories.content, `%${search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }
    
    if (userId) {
      whereConditions.push(eq(tradeStories.userId, userId as string));
    }
    
    if (isVerified === 'true') {
      whereConditions.push(eq(tradeStories.isVerified, true));
    }

    // Get stories with pagination
    const stories = await typedDb
      .select({
        id: tradeStories.id,
        title: tradeStories.title,
        content: tradeStories.content,
        tradeData: tradeStories.tradeData,
        insights: tradeStories.insights,
        isAnonymous: tradeStories.isAnonymous,
        isVerified: tradeStories.isVerified,
        likes: tradeStories.likes,
        comments: tradeStories.comments,
        shares: tradeStories.shares,
        views: tradeStories.views,
        tags: tradeStories.tags,
        createdAt: tradeStories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(tradeStories)
      .leftJoin(users, eq(tradeStories.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(
        sortBy === 'likes' ? desc(tradeStories.likes) :
        sortBy === 'views' ? desc(tradeStories.views) :
        sortBy === 'comments' ? desc(tradeStories.comments) :
        desc(tradeStories.createdAt)
      )
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    const totalCount = await typedDb
      .select({ count: count() })
      .from(tradeStories)
      .where(and(...whereConditions));

    // Get user's like status if authenticated
    let userLikes: string[] = [];
    if (req.isAuthenticated()) {
      const likes = await typedDb
        .select({ storyId: tradeStoryLikes.storyId })
        .from(tradeStoryLikes)
        .where(eq(tradeStoryLikes.userId, req.user!.id));
      
      userLikes = likes.map((like: any) => like.storyId as string);
    }

    res.json({
      success: true,
      data: {
        stories: stories.map((story: any) => ({
          ...story,
          isLiked: userLikes.includes(story.id),
          user: story.isAnonymous ? null : story.user
        })),
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

// Get specific trade story with comments
router.get("/:storyId", async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;

    // Get story details
    const story = await typedDb
      .select({
        id: tradeStories.id,
        title: tradeStories.title,
        content: tradeStories.content,
        tradeData: tradeStories.tradeData,
        insights: tradeStories.insights,
        isAnonymous: tradeStories.isAnonymous,
        isVerified: tradeStories.isVerified,
        likes: tradeStories.likes,
        comments: tradeStories.comments,
        shares: tradeStories.shares,
        views: tradeStories.views,
        tags: tradeStories.tags,
        createdAt: tradeStories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(tradeStories)
      .leftJoin(users, eq(tradeStories.userId, users.id))
      .where(eq(tradeStories.id, storyId))
      .limit(1);

    if (!story.length) {
      return res.status(404).json({
        success: false,
        error: "Story not found"
      });
    }

    // Get comments for the story
    const comments = await typedDb
      .select({
        id: tradeStoryComments.id,
        content: tradeStoryComments.content,
        likes: tradeStoryComments.likes,
        isVerified: tradeStoryComments.isVerified,
        createdAt: tradeStoryComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(tradeStoryComments)
      .leftJoin(users, eq(tradeStoryComments.userId, users.id))
      .where(eq(tradeStoryComments.storyId, storyId))
      .orderBy(desc(tradeStoryComments.createdAt));

    // Get user's like status if authenticated
    let isLiked = false;
    if (req.isAuthenticated()) {
      const like = await typedDb
        .select()
        .from(tradeStoryLikes)
        .where(and(
          eq(tradeStoryLikes.storyId, storyId),
          eq(tradeStoryLikes.userId, req.user!.id)
        ))
        .limit(1);
      
      isLiked = !!like.length;
    }

    // Increment view count
    await typedDb
      .update(tradeStories)
      .set({ 
        views: sql`${tradeStories.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(tradeStories.id, storyId));

    res.json({
      success: true,
      data: {
        story: {
          ...story[0],
          isLiked,
          user: story[0].isAnonymous ? null : story[0].user
        },
        comments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create new trade story
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, tradeData, insights, isAnonymous, tags } = req.body;

    if (!title || !content || !tradeData) {
      return res.status(400).json({
        success: false,
        error: "Title, content, and trade data are required"
      });
    }

    const newStory = await typedDb
      .insert(tradeStories)
      .values({
        userId: req.user!.id,
        title,
        content,
        tradeData,
        insights: insights || {},
        isAnonymous: isAnonymous || false,
        tags: tags || [],
        status: 'published'
      })
      .returning();

    res.json({
      success: true,
      data: newStory[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update trade story
router.put("/:storyId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const { title, content, tradeData, insights, isAnonymous, tags, status } = req.body;

    // Check if user owns the story or is admin
    const existingStory = await typedDb
      .select()
      .from(tradeStories)
      .where(eq(tradeStories.id, storyId))
      .limit(1);

    if (!existingStory.length) {
      return res.status(404).json({
        success: false,
        error: "Story not found"
      });
    }

    if (existingStory[0].userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own stories"
      });
    }

    const updatedStory = await typedDb
      .update(tradeStories)
      .set({
        title,
        content,
        tradeData,
        insights,
        isAnonymous,
        tags,
        status,
        updatedAt: new Date()
      })
      .where(eq(tradeStories.id, storyId))
      .returning();

    res.json({
      success: true,
      data: updatedStory[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Like/unlike trade story
router.post("/:storyId/like", requireAuth, async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;

    // Check if already liked
    const existingLike = await typedDb
      .select()
      .from(tradeStoryLikes)
      .where(and(
        eq(tradeStoryLikes.storyId, storyId),
        eq(tradeStoryLikes.userId, req.user!.id)
      ))
      .limit(1);

    if (existingLike.length) {
      // Unlike
      await typedDb
        .delete(tradeStoryLikes)
        .where(and(
          eq(tradeStoryLikes.storyId, storyId),
          eq(tradeStoryLikes.userId, req.user!.id)
        ));

      await typedDb
        .update(tradeStories)
        .set({ 
          likes: sql`${tradeStories.likes} - 1`,
          updatedAt: new Date()
        })
        .where(eq(tradeStories.id, storyId));

      res.json({
        success: true,
        data: { liked: false, likes: sql`${tradeStories.likes} - 1` }
      });
    } else {
      // Like
      await typedDb
        .insert(tradeStoryLikes)
        .values({
          storyId,
          userId: req.user!.id
        });

      await typedDb
        .update(tradeStories)
        .set({ 
          likes: sql`${tradeStories.likes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(tradeStories.id, storyId));

      res.json({
        success: true,
        data: { liked: true, likes: sql`${tradeStories.likes} + 1` }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Add comment to trade story
router.post("/:storyId/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Comment content is required"
      });
    }

    const newComment = await typedDb
      .insert(tradeStoryComments)
      .values({
        storyId,
        userId: req.user!.id,
        content,
        parentCommentId
      })
      .returning();

    // Update comment count
    await typedDb
      .update(tradeStories)
      .set({ 
        comments: sql`${tradeStories.comments} + 1`,
        updatedAt: new Date()
      })
      .where(eq(tradeStories.id, storyId));

    res.json({
      success: true,
      data: newComment[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Admin: Verify trade story
router.put("/:storyId/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    const { storyId } = req.params;
    const { isVerified } = req.body;

    const updatedStory = await typedDb
      .update(tradeStories)
      .set({
        isVerified,
        updatedAt: new Date()
      })
      .where(eq(tradeStories.id, storyId))
      .returning();

    if (!updatedStory.length) {
      return res.status(404).json({
        success: false,
        error: "Story not found"
      });
    }

    res.json({
      success: true,
      data: updatedStory[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
