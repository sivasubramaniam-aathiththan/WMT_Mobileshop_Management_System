import { text } from "express";
import nodemailer from "nodemailer";


const sendmail=async(email,subject,text)=>{

    const transporter=nodemailer.createTransport({


          host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL



        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({
        from:process.env.EMAIL_USER,
        to:email,
        subject:subject,
        text:text
    });

};
export default sendmail;
