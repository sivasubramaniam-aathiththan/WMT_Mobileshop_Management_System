import Order from "../models/order.js";
import Product from "../models/product.js";

// Place order — decreases stock
export const placeOrder = async (req, res) => {
    try {
        const { items, address, payment, totalAmount } = req.body;

        // Decrease stock for each product
        for (const item of items) {
            const productId = item.product || item._id;
            const product = await Product.findById(productId);
            if (!product)
                return res.status(404).json({ message: `Product not found: ${item.name}` });
            if (product.stock < item.qty)
                return res.status(400).json({ message: `Not enough stock for ${item.name}` });

            product.stock -= item.qty;
            await product.save();
        }

        // Normalize items to always store product ObjectId
        const normalizedItems = items.map((item) => ({
            ...item,
            product: item.product || item._id,
        }));

        // Save order
        const order = await Order.create({
            user: req.user._id,
            items: normalizedItems,
            address,
            payment: {
                cardHolder: payment.cardHolder,
                last4: payment.cardNumber.slice(-4)
            },
            totalAmount
        });

        return res.status(200).json({ message: "Order placed successfully", order });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get logged in user's orders
export const myOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Admin — get all orders
export const getAllOrders = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({ message: "Access denied" });

        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};



export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        // ── ADMIN ──────────────────────────────────────────────────────
        if (req.user.role === "admin") {

            // Restore stock if admin cancels
            if (status === "cancelled" && order.status !== "cancelled") {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock: item.qty } }
                    );
                }
            }

            order.status = status;
            await order.save();
            return res.status(200).json({ message: "Status updated", order });
        }

        // ── CUSTOMER ───────────────────────────────────────────────────

        // Must be their own order
        if (!order.user.equals(req.user._id))
            return res.status(403).json({ message: "Access denied" });

        const currentStatus = (order.status || "pending").trim().toLowerCase();

        // Customer cancels pending order
        if (status === "cancelled") {
            if (currentStatus !== "pending")
                return res.status(403).json({ message: "Only pending orders can be cancelled" });

            order.status = "cancelled";
            await order.save();
            return res.status(200).json({ message: "Order cancelled successfully", order });
        }

        // Customer marks delivered order as received
        if (status === "delivered") {
            if (currentStatus !== "delivered")
                return res.status(403).json({ message: "Only delivered orders can be marked as received" });

            order.status = "delivered";
            await order.save();
            return res.status(200).json({ message: "Order confirmed as received", order });
        }

        return res.status(403).json({ message: "Invalid status update" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Admin - get all users
export const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({ message: "Access denied" });

        const User = (await import("../models/user.js")).default;
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


// Admin — delete any order and restore stock
// User — delete only their own CANCELLED orders
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Order not found" });

        if (req.user.role === "admin") {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.qty } }
                );
            }
            await order.deleteOne();
            return res.status(200).json({ message: "Order deleted and stock restored" });
        }

        if (!order.user.equals(req.user._id))
            return res.status(403).json({ message: "Access denied" });

        const currentStatus = order.status.trim().toLowerCase();
        if (currentStatus !== "cancelled")
            return res.status(400).json({ message: "You can only delete cancelled orders" });

        await order.deleteOne();
        return res.status(200).json({ message: "Order deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};