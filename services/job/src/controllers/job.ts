import axios from "axios";
import { pool } from "../utils/db.js";
import bcrypt from 'bcrypt';
import FormData from "form-data";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { authenticationRequest } from "../middlewares/auth.js";

export const createCompany = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        return res.status(404).json({
            message: "Authentication required"
        })
    }
    if (user.role !== "recruiter") {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can create a company"
        })
    }
    const { name, description, website } = req.body;


    if (!name || !description || !website) {
        return res.status(404).json({
            message: "All the fields required"
        })
    }

    const existingCompanies =
        await pool.query(`SELECT company_id FROM companies WHERE name = ${name}`);

    if (existingCompanies.rows.length > 0) {
        return res.status(404).json({
            message: `A company with the name ${name} already exists`
        })
    }

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            message: "File is required"
        })
    }
    const formData = new FormData();
    formData.append("file", file.buffer, file.originalname);
    const { data } = await axios.post(
        `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
        formData,
        {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        }
    );
    const { url, public_id } = data;
    const result = await pool.query(`
        INSERT INTO companies (name, description, website, logo, logo_public_id, recruiter_id) VALUES 
        ($1, $2, $3, $4, $5, $6) RETURNING *`, [name, description, website, url, public_id, user.user_id]);

    return res.status(201).json({
        message: "Company created successfully",
        company: result.rows[0]
    })

}


export const deleteCompany = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        return res.status(404).json({
            message: "Authentication required"
        })
    }

    const { companyId } = req.params;

    const company =
        await pool.query(`SELECT logo_public_id FROM companies WHERE company_id = ${companyId} AND recruiter_id = ${user?.user_id}`);

    if (!company) {
        return res.status(404).json({
            message: "Company not found or you're not authorized to delete it."
        })
    }

    await pool.query(`DELETE FROM companies WHERE company_id = ${companyId}`);

    return res.status(200).json({
        message: "Company and all associated jobs have been deleted",
    });

}


export const createJob = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        return res.status(404).json({
            message: "Authentication required"
        })
    }
    if (user.role !== "recruiter") {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can create a company"
        })
    }

    const {
        title,
        description,
        salary,
        location,
        role,
        job_type,
        work_location,
        company_id,
        openings,
    } = req.body;

    if (!title || !description || !salary || !location || !role || !openings) {
        return res.status(404).json({
            message: "All the fields required"
        })
    }
    const company =
        await pool.query(`SELECT company_id FROM companies WHERE company_id = ${company_id} AND recruiter_id = ${user.user_id}`);

    if (!company.rows[0]) {
        return res.status(404).json({
            message: "Company not found or you're not authorized to create a job in this company."
        })
    }

    const newJob =
        await pool.query(`INSERT INTO jobs (title, description, salary, location, role, job_type, work_location, company_id, posted_by_recuriter_id, openings) VALUES (${title}, ${description}, ${salary}, ${location}, ${role}, ${job_type}, ${work_location}, ${company_id}, ${user.user_id}, ${openings}) RETURNING *`);

    res.json({
        message: "Job posted successfully",
        job: newJob.rows[0],
    });

}


export const updateJob = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        return res.status(404).json({
            message: "Authentication required"
        })
    }
    if (user.role !== "recruiter") {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can update a job"
        })
    }

    const {
        title,
        description,
        salary,
        location,
        role,
        job_type,
        work_location,
        company_id,
        openings,
        is_active,
    } = req.body;

    const existingJob =
        await pool.query(`SELECT posted_by_recuriter_id FROM jobs WHERE job_id = ${req.params.jobId}`);

    if (!existingJob.rows[0]) {
        return res.status(404).json({
            message: "Job not found or you're not authorized to update this job."
        })
    }

    if (existingJob.rows[0].posted_by_recuriter_id !== user.user_id) {
        return res.status(404).json({
            message: "Job not found or you're not authorized to update this job."
        })
    }

    const updatedJob = await pool.query(`UPDATE jobs SET title = ${title},
        description = ${description},
        salary = ${salary},
        location = ${location},
        role = ${role},
        job_type = ${job_type},
        work_location = ${work_location},
        openings = ${openings},
        is_active = ${is_active}
        WHERE job_id = ${req.params.jobId} RETURNING *;
    `);

    res.json({
        message: "Job updated successfully",
        job: updatedJob,
    });

}

export const getAllCompanies = async (req: authenticationRequest, res: Response, next: NextFunction) => {

    const companies = await pool.query(`SELECT * FROM companies WHERE recruiter_id = ${req.user?.user_id}`);
    return res.status(200).json({
        message: "Companies fetched successfully",
        companies: companies.rows,
    });

}

export const getCompanyDetails = async (req: authenticationRequest, res: Response, next: NextFunction) => {

    const { id } = req.params;
    if (!id) {
        return res.status(404).json({
            message: "Company id is required"
        })
    }
    const companyData = await pool.query(`SELECT * FROM companies WHERE company_id = ${id}`);
    if (!companyData.rows[0]) {
        return res.status(404).json({
            message: "Company not found"
        })
    }
    return res.status(200).json({
        message: "Company details fetched successfully",
        company: companyData.rows[0],
    });

}

export const getSingleJob = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const job =
        await pool.query(`SELECT * FROM jobs WHERE job_id = ${req.params.jobId}`);

    return res.status(200).json({
        message: "Job details fetched successfully",
        job: job.rows[0],
    });

}

export const getAllApplicationForJob = async (req: authenticationRequest, res: Response, next: NextFunction) => {

    const user = req.user;
    if (!user) {
        return res.status(404).json({
            message: "Authentication required"
        })
    }
    if (user.role !== "recruiter") {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can get all applications for a job"
        })
    }
    const { jobId } = req.params;
    const job = await pool.query(`SELECT posted_by_recuriter_id FROM jobs WHERE job_id = ${jobId}`);
    if (!job.rows[0]) {
        return res.status(404).json({
            message: "Job not found"
        })
    }
    if (job.rows[0].posted_by_recuriter_id !== user.user_id) {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can get all applications for this job"
        })
    }
    const applications =
        await pool.query(`SELECT * FROM applications WHERE job_id = ${jobId} ORDER BY subscribed DESC, applied_at ASC`);
    return res.status(200).json({
        message: "Applications fetched successfully",
        applications: applications.rows,
    });

}

export const updateApplication = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        return res.status(404).json({
            message: "Authentication required"
        })
    }

    if (user.role !== "recruiter") {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can access this"
        })
    }

    const { id } = req.params;

    const application =
        await pool.query(`SELECT * FROM applications WHERE application_id = ${id}`);

    if (!application.rows[0]) {
        return res.status(404).json({
            message: "Application not found"
        })
    }

    const job =
        await pool.query(`SELECT posted_by_recuriter_id, title FROM jobs WHERE job_id = ${application.rows[0].job_id}`);

    if (!job.rows[0]) {
        return res.status(404).json({
            message: "Job not found"
        })
    }

    if (job.rows[0].posted_by_recuriter_id !== user.user_id) {
        return res.status(404).json({
            message: "Forbidden: Only recruiter can access this"
        })
    }

    const updatedApplication =
        await pool.query(`UPDATE applications SET status = ${req.body.status} WHERE application_id = ${id} RETURNING *`);

    return res.status(200).json({
        message: "Application updated successfully",
        application: updatedApplication.rows[0],
    });

}

export const getAllActiveJobs = async (req: authenticationRequest, res: Response, next: NextFunction) => {

    const { title, location } = req.query as {
        title?: string;
        location?: string;
    };

    let querySting = `SELECT j.job_id, j.title, j.description, j.salary, j.location, j.job_type, j.role, j.work_location, j.created_at, c.name AS company_name, c.logo AS company_logo, c.company_id AS company_id FROM jobs j JOIN companies c ON j.company_id = c.company_id WHERE j.is_active = true`;

    const values = [];

    let paramIndex = 1;

    if (title) {
        querySting += ` AND j.title ILIKE $${paramIndex}`;
        values.push(`%${title}%`);
        paramIndex++;
    }

    if (location) {
        querySting += ` AND j.location ILIKE $${paramIndex}`;
        values.push(`%${location}%`);
        paramIndex++;
    }

    querySting += " ORDER BY j.created_at DESC";

    const jobs = (await pool.query(querySting, values));

    return res.status(200).json({
        message: "Jobs fetched successfully",
        jobs: jobs.rows,
    });

}

export const getAllCompany = async (req: authenticationRequest, res: Response, next: NextFunction) => {
    const companies =
        await pool.query(`SELECT * FROM companies WHERE recruiter_id = ${req.user?.user_id}`);

    return res.status(200).json({
        message: "Companies fetched successfully",
        companies: companies.rows,
    });

}