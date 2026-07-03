import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB,)

        console.log('Connected to MongoDB');

    }
  
  catch (error) {
    console.error( error);  }     
    
    };


    export default connectDB;