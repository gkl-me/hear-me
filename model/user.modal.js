const mongoose = require('mongoose');
const addressSchema = require('./address.modal')

const schema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    phone:{
        type:Number,
    },
    email:{
        type:String,
        required:true
    },
    password: {
        type:String,
    },

    address:{
        type: [addressSchema],
        default: []
    },

    isActive:{
        type:Boolean,
        default:true
    },
    googleId:{
        type: String,
    }
},{timestamps: true})

module.exports = mongoose.model('user',schema)