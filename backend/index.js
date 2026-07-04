import express from "express";
import dotenv from "dotenv";
import connectDB from "./Database/db.js";
import cors from 'cors';
dotenv.config();

const app = express();

//middleware
app.use(express.json());

app.use(cors({
    origin: "https://wmt-mobileshop-management-system-1.onrender.com" 
}));


const PORT = process.env.PORT;

//importing routs

import userRoutes from './routs/user.js';
import productRouts from './routs/product.js';
import orderRoutes from "./routs/order.js";
import reviewRoutes from "./routs/review.js";

app.use('/api', userRoutes);
app.use('/api', productRouts);
app.use("/api", orderRoutes);
app.use("/api", reviewRoutes);



app.use("/uploads",express.static("Uploads"));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  connectDB();  
});

