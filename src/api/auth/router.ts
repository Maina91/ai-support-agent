import { Router } from "express";
import { authService } from "../../services/auth/authService";
import { authenticate } from "../../middleware/authenticateMiddleware.js";
import cookieParser from "cookie-parser";

const router = Router();

router.use(cookieParser());

router.post("/register", async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(
      req.body
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user, accessToken });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: "Registration failed", message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user, accessToken });
  } catch (err: any) {
    res.status(401).json({ error: "Login failed", message: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  try {
    const tokens = await authService.refresh(refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: tokens.accessToken });
  } catch {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

router.post("/logout", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    await authService.logout(userId);
    res.clearCookie("refreshToken");
    res.status(204).end();
  } catch (err: any) {
    res.status(401).json({ error: "Logout failed", message: err.message });
  }
});

export const authRouter = router;