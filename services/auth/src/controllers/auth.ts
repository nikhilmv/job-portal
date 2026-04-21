import { Request, Response, NextFunction } from "express";
import { pool } from "../utils/db.js";
import bcrypt from "bcrypt";
import getBuffer from "../utils/buffer.js";
import axios from "axios";
import FormData from "form-data";
import jwt from "jsonwebtoken";
import { forgotPasswordTemplate } from "../emailtemplate.js";
import { publishToTopic } from "../producer.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password, phoneNumber, role, bio } = req.body;
  if (!name || !email || !password || !phoneNumber || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email],
  );
  if (existingUser.rows.length > 0) {
    return res
      .status(400)
      .json({ message: "User with this email already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  let registeredUser;
  if (role === "recruiter") {
    const result = await pool.query(
      `
                INSERT INTO users
                (name, email, password, phone_number, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                `,
      [name, email, hashedPassword, phoneNumber, role],
    );

    registeredUser = result.rows[0];
    // return res.status(201).json({ message: "Recruiter registered successfully", user });
  } else if (role === "jobseeker") {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const formData = new FormData();

    formData.append("file", file.buffer, file.originalname);

    // const buffer = getBuffer(file);
    // if (!buffer || !buffer.content) {
    //     return res.status(400).json({ message: "Failed to process resume" });
    // }
    // console.log(`${process.env.UPLOAD_SERVICE}/api/utils/upload`);

    const { data } = await axios.post(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );
    const result = await pool.query(
      `
                INSERT INTO users
                (name, email, password, phone_number, role, bio, resume, resume_public_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
                `,
      [
        name,
        email,
        hashedPassword,
        phoneNumber,
        role,
        bio,
        data.url,
        data.public_id,
      ],
    );

    registeredUser = result.rows[0];
  }

  const jwttoken = jwt.sign(
    { id: registeredUser?.user_id },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" },
  );

  return res.status(201).json({
    message: "User registered successfully",
    registeredUser,
    jwttoken,
  });
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "all fields required",
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
            WHERE u.email = $1 
            GROUP BY u.user_id
        `,
    [email],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      message: "user not found",
    });
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "invalid password",
    });
  }

  const jwttoken = jwt.sign(
    { id: user.user_id },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" },
  );

  return res.status(200).json({
    message: "User logged in successfully",
    user,
    jwttoken,
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      message: "email is required",
    });
  }

  const users = await pool.query(
    `SELECT user_id, email FROM users WHERE email = $1`,
    [email],
  );

  if (users.rows.length === 0) {
    return res.status(404).json({
      message: "user not found",
    });
  }

  const user = users.rows[0];

  const resetToken = jwt.sign(
    {
      email: user.email,
      type: "reset",
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" },
  );
  const resetLink = `${process.env.Frontend_Url}/reset/${resetToken}`;
  const message = {
    to: email,
    subject: "RESET Your Password",
    html: forgotPasswordTemplate(resetLink),
  };

  publishToTopic("send-mail", message).catch((error) => {
    console.error("failed to send message", error);
  });
  return res.status(200).json({
    message: "we have sent a reset link to your email",
  });
};
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token } = req.params;
  const { password } = req.body;

  console.log("token", token, "password", password);
  let decoded: any;

  try {
    decoded = jwt.verify(token as string, process.env.JWT_SECRET as string);
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    const decodedToken: any = jwt.decode(token as string);
    if (decodedToken) {
      console.log(
        "Token iat (Issued At):",
        new Date(decodedToken.iat * 1000).toLocaleString(),
      );
      console.log(
        "Token exp (Expires At):",
        new Date(decodedToken.exp * 1000).toLocaleString(),
      );
      console.log("Current Server Time:", new Date().toLocaleString());
    }
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "token has been expired",
      });
    }
    return res.status(400).json({
      message: "invalid token",
    });
  }

  if (decoded.type !== "reset") {
    return res.status(400).json({
      message: "Invalid token type",
    });
  }

  const email = decoded.email;

  const users = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [
    email,
  ]);

  if (users.rows.length === 0) {
    return res.status(404).json({
      message: "user not found",
    });
  }

  const user = users.rows[0];

  const hashPassword = await bcrypt.hash(password, 10);

  await pool.query(`UPDATE users SET password = $1 WHERE user_id = $2`, [
    hashPassword,
    user.user_id,
  ]);

  res.json({ message: "Password changed successfully" });
};
