import mongoose from 'mongoose';
import Product from '../models/product.js';

// ADD PRODUCT
export const addProduct = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({ message: "access denied" });

        const { name, description, price, stock, mrp, category, imageUrl } = req.body;

        if (!imageUrl)
            return res.status(400).json({ message: "image URL is required" });
        if (!category)
            return res.status(400).json({ message: "category is required" });

        const product = await Product.create({ name, description, price, stock, mrp, category, image: imageUrl });
        return res.status(201).json({ message: "product added successfully", product });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// FETCH ALL PRODUCTS
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        return res.status(200).json({
            message: "all products fetched successfully",
            length: products.length,
            products
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// FETCH SINGLE PRODUCT
export const fetchSingleProduct = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "invalid product id" });
        }

        const product = await Product.findById(id); // ✅ declared before use

        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }

        return res.status(200).json({ message: "product detail", product });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "access denied" });
        }

        const product = await Product.findById(req.params.id); // ✅ capital P

        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }

        if (product.image && !product.image.startsWith("http")) {
            rm(product.image, () => {
                console.log("image deleted from server");
            });
        }

        await product.deleteOne();

        return res.status(200).json({ message: "product deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({ message: "access denied" });

        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "invalid product id" });

        const product = await Product.findById(id);
        if (!product)
            return res.status(404).json({ message: "product not found" });

        const { name, description, price, stock, mrp, category, imageUrl } = req.body;

        product.name        = name        || product.name;
        product.description = description || product.description;
        product.price       = price       || product.price;
        product.stock       = stock       || product.stock;
        product.mrp         = mrp         || product.mrp;
        product.category    = category    || product.category;
        if (imageUrl) product.image = imageUrl;

        await product.save();
        return res.status(200).json({ message: "product updated successfully", product });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};