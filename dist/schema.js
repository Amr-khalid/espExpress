"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    username: String,
    password: String,
    email: String,
    address: String,
    phone: String,
    temp: String
});
exports.schema = (0, mongoose_1.model)("User", UserSchema);
