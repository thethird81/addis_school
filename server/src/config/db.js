import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import { PrismaClient } from "../../prisma/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly target the shared environment file
dotenv.config({ path: join(__dirname, "../../.env") });

const baseConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!baseConnectionString) {
  console.error("CRITICAL: Neither DIRECT_URL nor DATABASE_URL was found in the environment variables.");
}

// Append connection string parameters safely
const separator = baseConnectionString?.includes('?') ? '&' : '?';
const connectionString = baseConnectionString ? `${baseConnectionString}${separator}sslmode=require` : undefined;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Bypasses self-signed certificate constraints on Render
  },
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" 
    ? ["query", "info", "error", "warn"] 
    : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();    
    console.log("Connected to the database successfully!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  } 
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();         
    console.log("Disconnected from the database successfully!");
  } catch (error) {
    console.error("Error disconnecting from the database:", error);
  }   
}; 

export { connectDB, disconnectDB, prisma };