
// import jwt from "jsonwebtoken"
// export const generateToken = (userId, res) => {
//     const payload = {id: userId};
//     const token = jwt.sign(payload, "5OwkxRdGA922GHVi70c/JA5mFlzbOghtQm5iGb/lQ0k=", { 
//         expiresIn: process.env.JWT_EXPIRATION || '7d' });
       
//     return token;
    
// }   

 import jwt from "jsonwebtoken"

export const generateTokens = (user) => {
   // console.log("Generating tokens for user role:", user.role); // Debug log to check the user object
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
  );

  return { accessToken, refreshToken };
};
;