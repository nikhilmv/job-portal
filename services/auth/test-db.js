import dotenv from "dotenv";
import { sql } from "./src/utils/db.js";
dotenv.config();
async function test() {
    const result = await sql `SELECT NOW()`;
    console.log(result);
}
test();
//# sourceMappingURL=test-db.js.map