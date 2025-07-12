// src/routes/auth/userRoute.ts
import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { verifyJwtMiddleware } from "../../middleware/verifyJwtMiddleware";

const router = Router();

/**
 * GET /api/user/me
 * Securely returns current authenticated user
 */
router.get("/me", verifyJwtMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user?.userId) {
    return res.status(401).json({ error: "Unauthorized: Invalid JWT payload" });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        // updatedAt: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(dbUser);
  } catch (error) {
    console.error("Error fetching /me:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export const userRouter = router;
