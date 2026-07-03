import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    mrp: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,       // ✅ was missing
        required: true,
        default: 0,
    },
    image: {
        type: String,
        required: true,
    },
    sold: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,  // ✅ removed () — Date.now() freezes the value at startup
    },
});

const Product = mongoose.model("Product", productSchema);
export default Product;