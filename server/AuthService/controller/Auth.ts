import { Request, Response } from "express";
import tokenProvider from "../middlewares/TokenProvider";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

interface LoginData {
    email: string;
    password: string;
}

const LoginService = async (
    req: Request<{}, {}, LoginData>,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        // TODO:
        // Save the user in the database

        // const user = 1 | await User.findOne({ email });
        // const matched = await bcrypt.compare(password, user.password);
        // if (!user || !matched) {
        //     return res.status(401).json({
        //         message: "Invalid email or password"
        //     });
        // }
        const token = await jwt.sign(req.body, process.env.JWT_SECRET, { expiresIn: "1h" });

        return res.status(200).json({
            message: "Login successful",
            token,
        });

    } catch (error: any) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

const RegisterService = (
    req: Request<{}, {}, LoginData>,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        // TODO:
        // Save the user in the database

        return res.status(201).json({
            message: "User registered successfully",
            data: {
                email,
            },
        });

    } catch (error: any) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

export { LoginService, RegisterService };