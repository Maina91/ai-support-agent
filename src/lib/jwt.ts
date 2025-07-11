import jwt from "jsonwebtoken";
import config from "../config/index";


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
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}