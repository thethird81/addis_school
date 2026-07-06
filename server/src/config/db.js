import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL + "?sslmode=require";

const adapter = new PrismaPg({
  connectionString,
});

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
        process.exit(1); // Exit the process with an error code
    } };

    const disconnectDB = async () => {
        try {
            await prisma.$disconnect();         
            console.log("Disconnected from the database successfully!");
        } catch (error) {
            console.error("Error disconnecting from the database:", error);
        }   
    }; 

   

   export { connectDB, disconnectDB, prisma };