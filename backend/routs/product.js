import express from "express";  
import { isAuth } from "../middleware/isAuth.js";
import uploadfiles from "../middleware/multer.js";
import { addProduct } from "../controllers/product.js";
import { getAllProducts as fetchAllProducts } from "../controllers/product.js";
import { fetchSingleProduct } from "../controllers/product.js"; 
import { deleteProduct } from "../controllers/product.js";
import { updateProduct } from "../controllers/product.js";


const router=express.Router();

router.post("/product/new",isAuth,uploadfiles,addProduct);
router.get("/product/allproducts",fetchAllProducts);
router.get("/product/single/:id",fetchSingleProduct);
router.delete("/product/:id",isAuth,deleteProduct);
router.put("/product/update/:id", isAuth, uploadfiles, updateProduct);


export default router;




