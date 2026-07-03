import express from "express";
import {
    placeOrder,
    myOrders,
    getAllOrders,
    updateOrderStatus,
     deleteOrder,
    getAllUsers
} from "../controllers/order.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/order/place", isAuth, placeOrder);
router.get("/order/myorders", isAuth, myOrders);
router.get("/order/all", isAuth, getAllOrders);
router.put("/order/:id/status", isAuth, updateOrderStatus);
router.get("/admin/users", isAuth, getAllUsers);
router.delete("/order/:id", isAuth, deleteOrder); 

export default router;