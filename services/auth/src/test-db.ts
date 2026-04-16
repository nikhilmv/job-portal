import dotenv from "dotenv";
import { pool } from "./utils/db.js";


dotenv.config();

async function test() {
    const result = await pool.query("SELECT NOW()");
    console.log(result);
}

test(); 