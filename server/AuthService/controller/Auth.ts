import type { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../middlewares/TokenProvider";
import { pool } from "../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middlewares/TokenValidation";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_123";

const RegisterService = async (req: Request, res: Response) => {
    try {
        const { username, password, email } = req.body;
        console.log(req.body);
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        // Check if username already exists
        const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "Username is already taken" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert into database
        const result = await pool.query(
            "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
            [username, hashedPassword, email || null]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });
    } catch (error: any) {
        console.error("Register Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const LoginService = async (req: Request, res: Response) => {
    try {
        console.log(req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Fetch user from DB
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = result.rows[0];

        // Compare password hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token in DB
        await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

        // Set refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const RefreshService = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token is missing" });
        }

        // Verify the refresh token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err) {
            return res.status(403).json({ message: "Invalid or expired refresh token" });
        }

        // Fetch user from DB and verify that the token matches the stored token
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ message: "User not found" });
        }

        const user = result.rows[0];
        if (user.refresh_token !== refreshToken) {
            // Token reuse or revoked session! Revoke access for security.
            await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [user.id]);
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax"
            });
            return res.status(403).json({ message: "Session expired or token reused" });
        }

        // Generate new Access and Refresh tokens (Rotation!)
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Update DB
        await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [newRefreshToken, user.id]);

        // Set new refresh token in cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            accessToken: newAccessToken
        });
    } catch (error: any) {
        console.error("Refresh Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const LogoutService = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            // Remove refresh token from DB
            await pool.query("UPDATE users SET refresh_token = NULL WHERE refresh_token = $1", [refreshToken]);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const MeService = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const result = await pool.query(
            "SELECT id, username, email, created_at FROM users WHERE id = $1",
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: result.rows[0]
        });
    } catch (error: any) {
        console.error("Me Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export { RegisterService, LoginService, RefreshService, LogoutService, MeService };
