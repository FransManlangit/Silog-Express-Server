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
    if (images && !Array.isArray(images)) {
      images = [images];
    }

    console.log("Images after ensuring array format:", images);

    let uploadImages = [];
   
    if (images && images.length > 0) {
      for (const image of images) {
        console.log(image, "image for");

        const cloudinaryFolderOption = { folder: "product" };

        const result = await cloudinary.v2.uploader.upload(
          image,
          cloudinaryFolderOption
        );

        uploadImages.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

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

const updateProduct = async (req, res, next) => {
  try {
    const findProduct = await ProductModel.findById(req.params.id);

    if (!findProduct) {
      return next(
        new ErrorHandler(`Product not found with id: ${req.params.id}`)
      );
    }

    const { name, price, description} = req.body;
    let { images } = req.body;

    // Ensure images is an array
    if (images && !Array.isArray(images)) {
      images = [images];
    }
    
    let uploadImages = [];

    if (images && images.length > 0) {
      for (const image of images) {
        const cloudinaryFolderOption = { folder: "product" };

        const result = await cloudinary.v2.uploader.upload(
          image,
          cloudinaryFolderOption
        );

        uploadImages.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    } else {
      uploadImages = findProduct.images;
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        description,
        images: uploadImages,
      },
      { new: true }
    );

    console.log("updated Product", updatedProduct);

    res.status(200).json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler("An error occurred while updating the product", 500)
    );
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
      return next(
        new ErrorHandler(`Product does not exist with id: ${req.params.id}`)
      );
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    return next(new ErrorHandler("Error deleting the product", 500));
  }
};


const allProducts = async (req, res, next) => {
  try {
    const products = await ProductModel.find()
      .sort({ createdAt: -1 }); 

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching product data",
    });
  }
};


module.exports = {
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  allProducts,
};
