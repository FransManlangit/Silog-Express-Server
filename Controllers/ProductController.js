const ProductModel = require("../Models/Product");
const ErrorHandler = require("../Utils/ErrorHandler");
const cloudinary = require("cloudinary");
const mongoose = require("mongoose");
const APIFeatures = require("../Utils/ApiFeatures");



const createProduct = async (req, res, next) => {
  try {
    const { name, price, description } = req.body;
    let images = req.body.images;

    console.log("Request body received:", req.body);

    // Ensure images is an array
    images = images && Array.isArray(images) ? images : [images];

    console.log("Images after ensuring array format:", images);

    // Use Promise.all to upload all images concurrently
    const uploadImages = images && images.length > 0
      ? await Promise.all(images.map(async (image) => {
          try {
            console.log("Processing image:", image);

            const result = await cloudinary.v2.uploader.upload(image, {
              folder: "product",
            });

            console.log("Image upload result:", result);

            return {
              public_id: result.public_id,
              url: result.secure_url,
            };
          } catch (uploadError) {
            console.error("Error uploading image to Cloudinary:", uploadError);
            throw new Error("Failed to upload image");
          }
        }))
      : [];

    console.log("Images uploaded successfully:", uploadImages);

    // Create the product with the uploaded images
    const product = await ProductModel.create({
      name,
      price,
      description,
      images: uploadImages,
    });

    console.log("Product created successfully:", product);

    // Send response with created product
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};





const getSingleProduct = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Product ID not found!" });
  }

  const product = await ProductModel.findById(id).populate({
    path: "reviews",
    populate: { path: "user", model: "User" },
  });

  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found!" });
  }

  return res.status(202).json({ success: true, product });
};

module.exports = {
  createProduct,
  getSingleProduct,
};
