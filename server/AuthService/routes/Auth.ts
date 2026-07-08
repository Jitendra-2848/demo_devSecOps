import express from "express";
import {
    LoginService,
    RegisterService,
    RefreshService,
    LogoutService,
    MeService,
    GoogleRedirectService,
    GoogleCallbackService
} from "../controller/Auth";
import { authenticateToken } from "../middlewares/TokenValidation";

const route = express.Router();

route.post("/login", LoginService);
route.post("/register", RegisterService);
route.post("/refresh", RefreshService);
route.post("/logout", LogoutService);
route.get("/google", GoogleRedirectService);
route.get("/google/callback", GoogleCallbackService);
route.get("/me", authenticateToken, MeService);

export default route;
