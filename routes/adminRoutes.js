const express = require('express')
const admin = express.Router();
const isAdmin = require('../middleware/adminSession')
const adminController = require('../controller/adminController/adminController')
const collectionController = require('../controller/adminController/collectionController')
const productController = require('../controller/adminController/productController')
const userContoller = require('../controller/adminController/userController')


//home routes

admin.get('/',adminController.admin)
admin.get('/login',adminController.login)

admin.post('/login',adminController.loginPost);

admin.get('/home',isAdmin,adminController.home)

admin.get('/logout',adminController.logout)


//collection routes

admin.get('/collection',isAdmin,collectionController.collection)

admin.post('/addcollection',isAdmin,collectionController.addCollectionPost)

admin.get('/deletecollection/:id',isAdmin,collectionController.deleteCollection)

admin.get('/collectionstatus',isAdmin,collectionController.status)

admin.post('/editcollection',isAdmin,collectionController.editcollection)


//product routes

admin.get('/products',isAdmin,productController.product)

admin.get('/products/:id',isAdmin,productController.deleteProduct)

admin.get('/productstatus',isAdmin,productController.status)




//add product route
admin.get('/addproduct',isAdmin,productController.addProduct)

admin.post('/addproduct',productController.multer,productController.addproductPost)

//edit product

admin.get('/editproduct/:id',isAdmin,productController.editProduct)
admin.post('/editproduct/:id',isAdmin,productController.multer,productController.editProductPost)


//user
admin.get('/users',isAdmin,userContoller.users)
admin.get('/userstatus',isAdmin,userContoller.status)


module.exports=admin