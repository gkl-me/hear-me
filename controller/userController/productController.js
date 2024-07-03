const productSchema = require('../../model/product.model')
const wishlistSchema = require('../../model/wishlist.modal');
const findOffer = require('../../services/findOffer');

const productView = async (req,res)=> {

   try {
    
    const id = req.params.id;

    const product = await productSchema.findOne({_id: id, isActive: true})

    const similarProduct = await productSchema.find({productCollection: product.productCollection, _id: {$nin: [id]}}).limit(3)

    const productsWithDiscounts = await Promise.all(similarProduct.map(async p =>{
      const discount = await findOffer(p.id)
      const productDiscount = p.toObject()
      productDiscount.discount = discount
      productDiscount.discountMrp = (p.productPrice * (1- discount/100)).toFixed(2)
      return productDiscount

  } ))

  const discount = await findOffer(id)

  const productViewDiscount = product.toObject()
  productViewDiscount.discount = discount
  productViewDiscount.discountMrp = (product.productPrice*(1-discount/100)).toFixed(2)

   if(req.session.user){

      const userId = req.session.user

      const wishlist = await wishlistSchema.findOne({userId})
  
      res.render('user/productView',{title: product.productName,product:productViewDiscount, wishlist , similarProduct:productsWithDiscounts, user:req.session.user})

   }else{

      res.render('user/productView',{title: product.productName,product:productViewDiscount , similarProduct:productsWithDiscounts, user:req.session.user})

   }

   } catch (error) {
    console.log(`error while rendering product page ${error}`)
    
   //  error page for product not found should be rendered

    res.redirect('/user/explore')

   }

}

module.exports = {productView};