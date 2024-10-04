const app = require("./App");
const connectDatabase = require("./Config/Database");
const cloudinary = require("cloudinary");

require("dotenv").config({ path: "./Config/.env" });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  connectDatabase();
  
  console.log("database:", process.env.DATABASE);
  
  app.listen(process.env.PORT, () => {
    console.log(
      `server started on port:' ${process.env.PORT} in ${process.env.NODE_ENV} mode`
    );
  });
