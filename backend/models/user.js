import mongoose from 'mongoose';

const schema = mongoose.Schema({
    
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,

    },
    password:{
        type:String,
        required:true,
    },

     role:{
        type:String,
        enum: ["user", "admin"],
        default:"user",
        
    },
    contact:{
        type:String,
        required:true,

    },  
   

},{    timestamps:true,
});


export const User = mongoose.model("User", schema);
export default User;