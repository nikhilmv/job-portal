// import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();
import pg from "pg";


// console.log("db url " + process.env.DB_URL);



// if (!process.env.DB_URL) {
//     throw new Error("DB_URL is missing in .env");
// }


// export const sql = neon(process.env.DB_URL, {
//     fetchOptions: {
//         cache: "no-store",
//     },
// }); 
const { Pool } = pg;

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});