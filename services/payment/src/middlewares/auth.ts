import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool } from "../utils/db.js";

interface User {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  bio: string | null;
  resume: string | null;
  resume_public_id: string | null;
  profile_pic: string | null;
  profile_pic_public_id: string | null;
  skills: string[];
  subscription: string | null;
}

export interface authenticationRequest extends Request {
  user?: User;
}

export const isAuth = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authheader = req.headers.authorization;
    if (!authheader || !authheader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header is missing or invalid",
      });
    }

    const token = authheader.split(" ")[1];
    const decodedPayload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    if (!decodedPayload || !decodedPayload.id) {
      res.status(401).json({
        message: "invalid token",
      });
    }

    const result = await pool.query(
      `
        SELECT 
            u.user_id,
            u.name,
            u.email,
            u.password,
            u.phone_number,
            u.role,
            u.bio,
            u.resume,
            u.profile_pic,
            u.subscription_status,
            u.subscription_end_date,
            u.created_at,
            u.updated_at,
            ARRAY_AGG(s.name) 
            FILTER (WHERE s.name IS NOT NULL) AS skills
            FROM users u
            LEFT JOIN user_skills us ON u.user_id = us.user_id
            LEFT JOIN skills s ON us.skill_id = s.skill_id
            WHERE u.user_id = $1 
            GROUP BY u.user_id
        `,
      [decodedPayload.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    const user = result.rows[0];

    user.skills = user.skills || [];

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({
      message: "Authentication Failed. Please login again",
    });
  }
};
