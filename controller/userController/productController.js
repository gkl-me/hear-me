const productSchema = require('../../model/product.model')
const wishlistSchema = require('../../model/wishlist.modal')

const productView = async (req,res)=> {

   try {
    
    const id = req.params.id;

    const product = await productSchema.findOne({_id: id, isActive: true})

    const similarProduct = await productSchema.find({productCollection: product.productCollection, _id: {$nin: [id]}}).limit(3)

   if(req.session.user){

      const userId = req.session.user

      const wishlist = await wishlistSchema.findOne({userId})
  
      res.render('user/productView',{title: product.productName,product, wishlist , similarProduct, user:req.session.user})

   }else{

      res.render('user/productView',{title: product.productName,product , similarProduct, user:req.session.user})

   }

   } catch (error) {
    console.log(`error while rendering product page ${error}`)
    
   //  error page for product not found should be rendered

    res.redirect('/user/explore')

   }

}

module.exports = {productView};