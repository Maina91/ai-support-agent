import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
}
