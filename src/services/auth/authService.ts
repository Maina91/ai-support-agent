import { redis } from "../../lib/redis";
import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import config  from "../../config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { verifyJwt } from "../../middleware/verifyJwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "USER"]),
});


export const authService = {
  async login(input: unknown) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Invalid login input");
    }

    const { email, password, role } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error("Invalid credentials");

    if (user.role !== role) {
      throw new Error("Access denied: role mismatch");
    }

    const tokens = await authService.issueTokens({
      id: user.id,
      role: user.role,
    });
    return tokens;
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

  async refresh(userId: string, incomingToken: string) {
    const stored = await redis.get(`refresh:${userId}`);
    if (!stored || stored !== incomingToken) {
      throw new Error("Invalid or expired refresh token");
    }

    const payload = verifyJwt(incomingToken) as any;

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
    });
    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      role: payload.role,
    });

    await redis.set(
      `refresh:${userId}`,
      newRefreshToken,
      "EX",
      config.redis.ttl
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },
};




