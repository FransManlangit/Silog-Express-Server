const express = require("express");
const router = express.Router();
const upload = require("../Utils/Multer");
const {
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  allProducts,
} = require("../Controllers/ProductController");

const { isAuthenticatedUser, authorizeRoles } = require("../Middlewares/Auth");

router.post("/add/new/product", upload.array("images", 10), createProduct);

router.route("/products").get(allProducts);
router
  .route("/product/:id")
  .get(getSingleProduct)
  .put(upload.array("images"), updateProduct)
  .delete(deleteProduct);

module.exports = router;
