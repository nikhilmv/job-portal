import axios from "axios";
import { pool } from "../utils/db.js";
import bcrypt from "bcrypt";
import FormData from "form-data";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { authenticationRequest } from "../middlewares/auth.js";

export const myProfile = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getUserProfile = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `
            SELECT 
                u.user_id, u.name, u.email, u.phone_number, u.role, u.bio, 
                u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id,
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
      [userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    const user = result.rows[0];
    user.skills = user.skills || [];
    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateUserProfile = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  const { name, phoneNumber, bio } = req.body;

  if (!user) {
    return res.status(404).json({
      message: "user not found",
    });
  }

  if (name) {
    user.name = name;
  }
  if (phoneNumber) {
    user.phone_number = phoneNumber;
  }
  if (bio) {
    user.bio = bio;
  }

  const result = await pool.query(
    `
        UPDATE users
        SET name = $1, phone_number = $2, bio = $3
        WHERE user_id = $4
        RETURNING *
    `,
    [user.name, user.phone_number, user.bio, user.user_id],
  );

  return res.status(200).json({
    message: "User profile updated successfully",
    user: result.rows[0],
  });
};

export const updateProfilePic = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (!user) {
    return res.status(404).json({
      message: "Authentication required",
    });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "File is required",
    });
  }

  const oldPublicId = user.profile_pic_public_id;

  const formData = new FormData();
  formData.append("file", file.buffer, file.originalname);
  formData.append("public_id", oldPublicId);

  const response = await axios.post(
    `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
    formData,
    {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  const { url, public_id } = response.data;

  const result = await pool.query(
    `
        UPDATE users
        SET profile_pic = $1, profile_pic_public_id = $2
        WHERE user_id = $3
        RETURNING *
    `,
    [url, public_id, user.user_id],
  );

  return res.status(200).json({
    message: "User profile picture updated successfully",
    user: result.rows[0],
  });
};

export const updateResume = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (!user) {
    return res.status(404).json({
      message: "Authentication required",
    });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "pdf is required",
    });
  }

  const oldPublicId = user.resume_public_id;

  const formData = new FormData();
  formData.append("file", file.buffer, file.originalname);
  formData.append("public_id", oldPublicId);

  const response = await axios.post(
    `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
    formData,
    {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  const { url, public_id } = response.data;
  const queryresult = await pool.query(
    `UPDATE users SET resume = $1, resume_public_id = $2,updated_at = $3 WHERE user_id=$4 RETURNING *
        `,
    [url, public_id, new Date(), user.user_id],
  );
  return res.status(200).json({
    message: "User resume updated successfully",
    user: queryresult.rows[0],
  });
};

export const addSkillToUser = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.user_id;
    const { skillName } = req.body;

    if (!skillName || skillName.trim() === "") {
      return res.status(400).json({
        message: "Skill name is required",
      });
    }
    let wasSkillAdded = false;

    await client.query("BEGIN");
    const users = await client.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [userId],
    );
    if (users.rows.length === 0) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    console.log(users.rows);

    const skillResult = await pool.query(
      `
            INSERT INTO skills (name) VALUES ($1) 
            ON CONFLICT (name)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING skill_id`,
      [skillName.trim()],
    );
    const skillId = skillResult.rows[0].skill_id;

    const insertionResult = await client.query(
      `INSERT INTO user_skills (user_id, skill_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, skill_id)
         DO NOTHING
         RETURNING user_id`,
      [userId, skillId],
    );

    await client.query("COMMIT");
    if (insertionResult.rows.length === 0) {
      return res.status(200).json({
        message: "User already possesses this skill",
      });
    }
    return res.status(200).json({
      message: `Skill ${skillName.trim()} added successfully`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteSkillFromUser = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    const { skillName } = req.body;

    if (!skillName || skillName.trim() === "") {
      return res.status(400).json({
        message: "Skill name is required",
      });
    }
    const result = await client.query(
      `
      SELECT skill_id FROM skills WHERE name = $1
     `,
      [skillName.trim()],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "skill not found",
      });
    }
    const skillId = result.rows[0].skill_id;

    await client.query(
      `
      DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2
     `,
      [user.user_id, skillId],
    );

    return res.status(200).json({
      message: `Skill ${skillName.trim()} was deleted successfully`,
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

export const applyForJob = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    if (user.role !== "jobseeker") {
      return res.status(404).json({
        message: "Forbidden you are not allowed for this api",
      });
    }
    const applicant_id = user.user_id;

    const resume = user.resume;
    if (!resume) {
      return res.status(404).json({
        message: "You need to add resume in your profile to apply for this job",
      });
    }
    const { job_id } = req.body;
    if (!job_id) {
      return res.status(404).json({
        message: "job id is required",
      });
    }

    const job = await pool.query(
      `SELECT is_active FROM jobs WHERE job_id = $1`,
      [job_id],
    );
    if (job.rows.length === 0) {
      return res.status(404).json({
        message: "job not found",
      });
    }
    if (!job.rows[0].is_active) {
      return res.status(404).json({
        message: "job is not active",
      });
    }
    const now = Date.now();
    const subTime = req.user?.subscription
      ? new Date(req.user.subscription).getTime()
      : 0;

    const isSubscribed = subTime > now;

    let newApplication;

    try {
      newApplication = await client.query(
        `
          INSERT INTO applications (job_id, applicant_id, applicant_email, resume, subscribed)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
      `,
        [job_id, applicant_id, user?.email, resume, isSubscribed],
      );
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(409).json({
          message: "you have already applied to this job.",
        });
      }
      throw error;
    }

    return res.json({
      message: "Applied for job successfully",
      application: newApplication,
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

export const getAllaplications = async (
  req: authenticationRequest,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    const applications = await client.query(
      `
      SELECT * FROM applications WHERE applicant_id = $1
     `,
      [user.user_id],
    );
    return res.status(200).json({
      message: "Applications fetched successfully",
      applications: applications.rows,
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};
