import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_123";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

export const generateAccessToken = (user: { id: number | string; username: string }) => {
    return jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (user: { id: number | string; username: string }) => {
    return jwt.sign(
        { userId: user.id, username: user.username },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};