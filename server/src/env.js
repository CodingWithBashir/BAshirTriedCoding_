import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(serverDirectory, ".env") });
