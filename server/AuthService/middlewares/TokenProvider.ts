import jwt from "jsonwebtoken"

const tokenProvider = (req, res, next) => {
    try {
        
        console.log(token);
        next()
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" })
    }
}

export default tokenProvider;