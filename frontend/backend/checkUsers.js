import mongoose from 'mongoose';
import User from './models/user.js';

async function checkUsers() {
  try {
    await mongoose.connect(process.env.DB || 'mongodb://localhost:27017/mern_first');

    const users = await User.find({});
    console.log('Users in database:');
    users.forEach(u => console.log(`Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();