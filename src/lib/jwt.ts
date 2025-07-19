import jwt from "jsonwebtoken";
import config from "../config/index";
import { v4 as uuidv4 } from "uuid";


export interface JwtPayload {
  userId: string;
  role: string;
}

const ACCESS_SECRET = config.jwt.accessTokenSecret;
const REFRESH_SECRET = config.jwt.refreshTokenSecret;
const ACCESS_EXPIRES = config.jwt.accessTokenExpiresIn;
const REFRESH_EXPIRES = config.jwt.refreshTokenExpiresIn;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are missing in config");
}


export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload, jti: uuidv4() }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new Error("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}