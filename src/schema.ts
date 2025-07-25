import { Schema, model } from "mongoose";
const UserSchema=new Schema({
    username: String,
    password: String,
    email: String,
    address: String,
    phone:String,
    temp: String
})







export const schema = model("User", UserSchema);
