import { Router } from "express";
import { authService } from "../../services/auth/authService";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const tokens = await authService.login(req.body);
    return res.status(200).json(tokens);
  } catch (err: any) {
    return res.status(401).json({
      error: "Login failed",
      message: err.message,
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    await authService.logout(userId);
    res.status(204).end();
  } catch (err: any) {
    res.status(401).json({ error: "Logout failed", message: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  const { userId, refreshToken } = req.body;
  try {
    const tokens = await authService.refresh(userId, refreshToken);
    res.json(tokens);
  } catch (err) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

export const authRouter = router;
