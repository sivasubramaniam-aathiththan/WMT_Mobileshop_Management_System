import express from "express";
import { getReviews, addReview, editReview, deleteReview } from "../controllers/review.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.get("/reviews/:productId",          isAuth, getReviews);
router.post("/reviews/:productId",         isAuth, addReview);
router.put("/reviews/:reviewId",           isAuth, editReview);
router.delete("/reviews/:reviewId",        isAuth, deleteReview);

export default router;
