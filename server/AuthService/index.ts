import { config } from "dotenv"
config({
    path: "./.env"
});
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pool } from "./lib/db";
import authRoutes from "./routes/Auth";

const app = express();

const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

app.get("/", async (req, res) => {
    try {
        const a = await pool.query("select id, username from users limit 5");
        return res.send("I am running on port : " + PORT + " " + JSON.stringify(a.rows));
    } catch (e: any) {
        return res.send("I am running on port : " + PORT + " DB Error: " + e.message);
    }
});

app.listen(PORT, () => {
    console.log("Hello i am running on Port : " + PORT);
});
