import multer from "multer";
import {v4 as uuidv4} from "uuid";


const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"Uploads/");
    },
    filename:function(req,file,cb){
        const id=uuidv4();
        const extention=file.originalname.split(".").pop();
        const filename=`${id}.${extention}`;
        cb(null,filename);
    },
});

export const uploadfiles=multer({storage:storage}).single("image");
export default uploadfiles;

