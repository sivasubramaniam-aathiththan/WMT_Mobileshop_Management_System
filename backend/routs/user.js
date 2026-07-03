import express from 'express';
import bcrypt from "bcryptjs";
import {myProfil, registerUser, verifyUser, getAllUsers, createUser, updateUser, deleteUser } from '../controllers/user.js';   
import {loginUser} from '../controllers/user.js';   
import {isAuth, isAdmin} from '../middleware/isAuth.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';




const router=express.Router();


router.post("/user/register",registerUser);
router.post("/user/verify",verifyUser);
router.post("/user/login",loginUser);
router.get("/user/profile",isAuth,myProfil);    

// Admin routes
router.get("/admin/users", isAuth, isAdmin, getAllUsers);
router.post("/admin/users", isAuth, isAdmin, createUser);
router.put("/admin/users/:id", isAuth, isAdmin, updateUser);
router.delete("/admin/users/:id", isAuth, isAdmin, deleteUser);


export default router;