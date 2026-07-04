import {config} from "dotenv"
config();
import express from "express";
import cors from "cors";

const app = express();

const PORT = process.env.PORT;
app.get("/",(req,res)=>{
    return res.send("I am running on port : " + PORT);
})
app.listen(PORT,()=>{
    console.log("Hello i am running on Port : " + PORT);
})
