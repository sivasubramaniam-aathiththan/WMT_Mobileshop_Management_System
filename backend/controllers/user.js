import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendmail from '../middleware/sendmail.js';

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, contact,role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);


         const assignRole = role ==="admin" ? "admin":"user";

        // Store user data in token
        const userData = { 
            name, 
            email: email.toLowerCase().trim(), 
            password: hashedPassword, 
            contact ,
            role:assignRole,
        };

        // Create activation token
        const activationToken = jwt.sign(
            { user: userData, otp }, 
            process.env.ACTIVATION_SECRET, 
            { expiresIn: '5m' }
        );

        // Send OTP email
        const message = `Your OTP is: ${otp}. Valid for 5 minutes.`;
        await sendmail(email, 'Account Activation OTP', message);

        return res.status(200).json({ 
            message: "Please verify your email to activate your account", 
            activationToken 
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// VERIFY OTP
export const verifyUser = async (req, res) => {
    try {
        const { activationToken, otp } = req.body;

        // Verify token
        let verify;
        try {
            verify = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "OTP expired. Please register again." });
        }

        // Check OTP  (convert both to numbers to avoid type mismatch)
        if (Number(verify.otp) !== Number(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if user already verified
        const existingUser = await User.findOne({ email: verify.user.email });
        if (existingUser) {
            return res.status(400).json({ message: "User already verified. Please login." });
        }

        // Save user to DB
        await User.create({
            name: verify.user.name,
            email: verify.user.email,
            password: verify.user.password,
            contact: verify.user.contact,
             role:     verify.user.role,
        });

        return res.status(200).json({ message: "Account activated! You can now login." });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// LOGIN
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

 console.log("Email received:", email);        
 console.log("Password received:", password);



        // Find user (normalize email)
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "No account found with this email" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Remove password from response
        const { password: userPassword, ...userDetails } = user.toObject();

        return res.status(200).json({ 
            message: "Login successful", 
            token, 
            user: userDetails 
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET PROFILE
export const myProfil = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        return res.status(200).json({ message: "Profile fetched successfully", user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ADMIN: GET ALL USERS
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ADMIN: CREATE USER
export const createUser = async (req, res) => {
    try {
        const { name, email, password, contact, role } = req.body;

        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            contact,
            role: role || 'user'
        });

        const { password: _, ...userDetails } = user.toObject();
        return res.status(201).json({ message: "User created successfully", user: userDetails });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ADMIN: UPDATE USER
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, contact, role } = req.body;

        const updateData = { name, email: email.toLowerCase().trim(), contact, role };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ADMIN: DELETE USER
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};