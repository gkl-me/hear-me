const productSchema = require('../../model/product.model')
const upload = require('../../middleware/multer')
const collectionSchema = require('../../model/collection.model')
const fs = require('fs');
const path = require('path');

const product = async (req,res) => {

    try {
        
        const search = req.query.search || "";

        const products = await productSchema.find({productName: {$regex: search, $options: 'i'}})

        res.render('admin/products',{title: 'Products',products})

    } catch (error) {
        console.log(`error from product page ${error}`)
    }

}

const addProduct = async (req,res) => {
    try {
        
        const productCollection = await collectionSchema.find({isActive: true})

        res.render('admin/addProduct',{title: "Add Product",productCollection})

    } catch (error) {
        console.log(`error while rendering addproduct page ${error}`)
    }
}


//multer upload 

const multer = upload.array('image',3);


//addproduct post

const addproductPost = async (req,res) => {
    try {

        const uploadDir = path.join(__dirname, '..','..', 'uploads'); 

        const imgArray = []

        let croppedImages = req.body.croppedImages
        console.log(croppedImages)
        
        if (!Array.isArray(croppedImages)) {
            // Ensure that croppedImages is always an array
            croppedImages = [croppedImages];
        }

        croppedImages.forEach((imageData, index) => {
            const base64Data = imageData.split(',')[1];
            const originalName = `image-${index}`; // Placeholder for the original name
            const fileName = `${Date.now()}-${originalName}.png`;
            const filePath = path.join('uploads', fileName);
    
            // Save the image
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            imgArray.push(filePath);
        });
        
        

        req.files.forEach((img) =>{
            imgArray.push(img.path)
        })

        const product=
         {
            productName: req.body.productName,
            productPrice: req.body.productPrice,
            productCollection: req.body.productCollection,
            productQuantity: req.body.productQuantity,
            productDescription: req.body.productDescription,
            productImage: imgArray
        }
        
        const check = await productSchema.findOne({productName: product.productName, productCollection: product.productCollection, })

        if(!check){
            await productSchema.insertMany(product);
            req.flash('success','Product Successfully added')
        }else{
            req.flash('error','Product already exists')
        }
        res.redirect('/admin/products')

    } catch (error) {
        console.log(`error while adding product ${error}`)
        req.flash('error','Failed to added product')
        res.redirect('/admin/addproduct')
        
    }
}


const editProduct = async (req,res) => {
   
    try {
    
        const id = req.params.id;
        const product = await productSchema.findById(id)
        if(product){
            res.render('admin/editproduct',{title:'Edit Product',product})
        }else{
            req.flash('error','Unable to edit product')
            res.redirect('/admin/products')
        }


    } catch (error) {
        console.log(`error while loading edit product page ${error}`)
    }
}


const editProductPost = async (req,res)=> {
    try {
        
        //get the id of the product from params
        const id = req.params.id;

        //array of images to delete if not empty 
        const imagesToDelete = JSON.parse(req.body.deletedImages || '[]');

        //delete image from the backend 
        imagesToDelete.forEach(x => fs.unlinkSync(x))

        //update the product with id 
        await productSchema.findByIdAndUpdate(id,
            {productPrice: req.body.productPrice,
            productQuantity: req.body.productQuantity,
            productDescription: req.body.productDescription,
        })

        //if image present remove from db 
        if(imagesToDelete.length>0){
            await productSchema.findByIdAndUpdate(id,{
                $pull:{productImage: {$in: imagesToDelete}}
            })
        }

        //add input file path into db 
        if (req.files && req.files.length > 0) {
            const imagePaths = req.files.map(file => file.path.replace(/\\/g, '/'));
            await productSchema.findByIdAndUpdate(id, {
              $push: { productImage: { $each: imagePaths } }
            });
          }


          req.flash('success','product successfully updated')
          res.redirect('/admin/products')


    } catch (error) {
        console.log(`error while editing product post ${error} `)
        req.flash('error',"Could not edit the product")
        res.redirect('/admin/products')
    }
}


const status = async (req,res)=> {
    try {
        const{ id,status} = req.query;
        const newStatus = !(status === 'true')

        await productSchema.findByIdAndUpdate(id,{isActive: newStatus})
        res.redirect('/admin/products')

    } catch (error) {
        console.log(`error while changing status ${error}`)
    }
}



const deleteProduct =async (req,res)=>{
    try {
        
        const id = req.params.id;
        const img = await productSchema.findById(id)
        img.productImage.forEach((x)=>{
            fs.unlinkSync(x)
        })
        const product = await productSchema.findByIdAndDelete(id)
        if(product != null){
            req.flash('success','Product successfully removed')
            res.redirect('/admin/products')
        }else{
            req.flash('error','Couldnt delete the product')
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(`error while deleting the product ${error}`)
    }
}



module.exports = {product,deleteProduct,status,addProduct,multer,addproductPost,editProduct,editProductPost}