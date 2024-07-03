const express = require("express")
const app = express()
require("dotenv").config()

const adminRoutes = require('./routes/adminRoutes')
const userRoutes = require('./routes/userRoutes')

const session = require('express-session')
const {v4: uuidv4} = require('uuid')

const nocache = require('nocache')

const path = require("path")
const connectDB = require("./config/connection")

//flash message
const flash = require('connect-flash')

//google auth
const passport = require("passport")
const auth = require('./config/auth')


const port = process.env.PORT || 3000

//mongodb connection 
connectDB();

//setting view engine
app.set('view engine','ejs')

//public static files
app.use('/public',express.static(path.join(__dirname,'public')))
app.use('/uploads',express.static(path.join(__dirname,'uploads')))


//url encoded data
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// middlewares

app.use(nocache())
app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: false
}))

app.use(flash())

app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    next();
})


app.use((req,res,next)=>{
    res.locals.isAdmin = req.session.admin;
    next();
})


//main route

app.get("/",(req,res)=>{
    try {
        res.redirect('/user')
    } catch (error) {
        console.log(`error from main route ${error}`)
    }
    
})



//routes
app.use('/admin',adminRoutes)
app.use('/user',userRoutes)


app.listen(port,(err)=>{
    if(err){
        console.log("Error while listening port")
    }else{
        console.log(`Port running in http://localhost:${port}`)
    }
})
