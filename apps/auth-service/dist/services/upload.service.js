"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const streamifier_1 = __importDefault(require("streamifier"));
const CloudinaryProvider_1 = require("../providers/CloudinaryProvider");
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = CloudinaryProvider_1.cloudinary.uploader.upload_stream({ folder: 'avatars' }, (error, result) => {
            if (error)
                return reject(error);
            if (result)
                resolve(result.secure_url);
        });
        streamifier_1.default.createReadStream(buffer).pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
