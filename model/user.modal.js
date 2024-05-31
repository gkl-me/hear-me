const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    phone:{
        type:Number,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    password: {
        type:String,
        required: true
    },
    isActive:{
        type:Boolean,
        default:true
    }
})

module.exports = mongoose.model('user',schema)