const express = require('express')
const user = express.Router();
const isUser = require('../middleware/userSession')

const userContoller = require('../controller/userController/userController')
const homeController = require('../controller/userController/homeController')
const productController = require('../controller/userController/productController')
const profileContoller = require('../controller/userController/profileController')
const forgotPassword = require('../controller/userController/forgotPassword')
const cartController = require('../controller/userController/cartController')
const checkoutController = require('../controller/userController/checkoutController')
const orderController = require('../controller/userController/orderController')

const passport = require('passport')



//main
user.get('/',userContoller.user)

//login
user.get('/login',userContoller.login)
user.post('/login',userContoller.loginPost)

//auth

user.get('/auth/google',userContoller.auth)
user.get('/auth/google/redirect',passport.authenticate('google'),userContoller.authRedirect)


//signup
user.get('/signup',userContoller.signup)
user.post('/signup',userContoller.signgupPost)

//otp verify
user.get('/verify',userContoller.verify)
user.post('/verify',userContoller.verifyPost)
user.get('/resend/:email',userContoller.otpResend)

//home
user.get('/home',homeController.home)
user.get('/explore',homeController.explore)

//product view
user.get('/product/:id',productController.productView);

//logout 
user.get('/logout',userContoller.logout)

//profile

user.get('/profile',isUser,profileContoller.profile)
user.post('/addAddress',isUser,profileContoller.addAddress)
user.post('/editAddress/:id',isUser,profileContoller.editAddress)
user.post('/passwordChange',isUser,profileContoller.changePassword)
user.post('/updateProfile',isUser,profileContoller.updateProfile)
user.get('/deleteAddress/:id',isUser,profileContoller.deleteAddress)

//forgot password

user.get('/forgotpassword',forgotPassword.forgotPassword)
user.post('/forgotpassword',forgotPassword.forgotPasswordPost)
user.get('/forgotpasswordotp',forgotPassword.forgotPasswordOtp)
user.post('/forgotpasswordotp',forgotPassword.forgotPasswordOtpPost)
user.post('/resetpassword',forgotPassword.resetPasswordPost)
user.get('/forgotpassword-resend/:email',forgotPassword.forgotResend)



//cart routes

user.get('/cart',isUser,cartController.renderCart)
user.post('/cart/add',isUser,cartController.addToCart)
user.post('/cart/increment',isUser,cartController.increment)
user.post('/cart/decrement',isUser,cartController.decrement)
user.post('/cart/remove',isUser,cartController.removeFromCart)

// checkout routes

user.get('/checkout',isUser,checkoutController.renderCheckout)
user.post('/checkout/addAddress',isUser,checkoutController.addAddress)
user.post('/checkout',isUser,checkoutController.checkoutProceed)


//order page
user.get('/orders',isUser,orderController.order)
user.get('/orderCancel/:id',isUser,orderController.cancelOrder)


module.exports = user;