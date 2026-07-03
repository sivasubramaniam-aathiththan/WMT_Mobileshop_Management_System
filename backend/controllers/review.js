import Review from "../models/review.js";

// GET all reviews for a product
export const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
        return res.status(200).json({ reviews });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ADD review (one per user per product)
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.productId;

        const existing = await Review.findOne({ product: productId, user: req.user._id });
        if (existing)
            return res.status(400).json({ message: "You have already reviewed this product" });

        const review = await Review.create({
            product: productId,
            user:    req.user._id,
            name:    req.user.name,
            rating,
            comment,
        });
        return res.status(201).json({ message: "Review added", review });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// EDIT own review
export const editReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review)
            return res.status(404).json({ message: "Review not found" });
        if (!review.user.equals(req.user._id))
            return res.status(403).json({ message: "Access denied" });

        const { rating, comment } = req.body;
        if (rating)  review.rating  = rating;
        if (comment) review.comment = comment;
        await review.save();
        return res.status(200).json({ message: "Review updated", review });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// DELETE own review
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review)
            return res.status(404).json({ message: "Review not found" });
        if (!review.user.equals(req.user._id) && req.user.role !== "admin")
            return res.status(403).json({ message: "Access denied" });

        await review.deleteOne();
        return res.status(200).json({ message: "Review deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
