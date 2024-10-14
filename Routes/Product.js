const express = require("express");
const router = express.Router();
const upload = require("../Utils/Multer")
const { createProduct, 
    getSingleProduct, 
    } = require("../Controllers/ProductController");

const { isAuthenticatedUser, authorizeRoles } = require("../Middlewares/Auth");

router.post('/add/new/product', upload.array('images', 10), createProduct);


module.exports = router;