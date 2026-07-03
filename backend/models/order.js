import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: String,
            image: String,
            price: Number,
            qty: Number
        }
    ],
    address: {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        postalCode: String
    },
    payment: {
        cardHolder: String,
        last4: String
    },
    totalAmount: Number,
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "processing", "shipped", "delivered"],
        default: "pending"
    }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);