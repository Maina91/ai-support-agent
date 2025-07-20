import { redis } from "../../lib/redis";
import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import config from "../../config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { verifyAccessToken, verifyRefreshToken } from "../../lib/jwt";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "USER", "Agent"]),
});


export const authService = {
  async register(input: unknown) {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Invalid registration input");
    }

    const { firstName, lastName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    const tokens = await authService.issueTokens({
      id: newUser.id,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      ...tokens,
    };
  },

  async login(input: unknown) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Invalid login input");
    }

    const { email, password, role } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error("Invalid credentials");

    if (user.role !== role) {
      throw new Error("Access denied: role mismatch");
    }

    const tokens = await authService.issueTokens({
      id: user.id,
      role: user.role,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  },

  async issueTokens(user: { id: string; role: string }) {
    const payload = { userId: user.id, role: user.role };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await redis.set(`refresh:${user.id}`, refreshToken, "EX", config.redis.ttl);

    return { accessToken, refreshToken };
  },

  async logout(userId: string) {
    await redis.del(`refresh:${userId}`);
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const userId = payload?.userId;

    if (!userId) throw new Error("Invalid refresh token");

    const stored = await redis.get(`refresh:${userId}`);
    if (!stored || stored !== refreshToken) {
      throw new Error("Expired or invalid token");
    }

    const newAccessToken = signAccessToken({ userId, role: payload.role });
    const newRefreshToken = signRefreshToken({ userId, role: payload.role });

    await redis.set(
      `refresh:${userId}`,
      newRefreshToken,
      "EX",
      config.redis.ttl
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },
};




