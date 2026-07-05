import express from "express"
import {LoginService,RegisterService} from "../controller/Auth.ts"


const route = express.Router();


route.post("/login",LoginService);
route.post("/Register",RegisterService);


export default route;