// src/routes/auth/userRoute.ts
import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { verifyJwtMiddleware } from "../../middleware/verifyJwtMiddleware";

const router = Router();

router.get("/me", verifyJwtMiddleware, async (req, res) => {
  const user = (req as any).user;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(dbUser);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export const userRouter = router;
