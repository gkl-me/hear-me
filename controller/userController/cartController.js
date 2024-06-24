const cartSchema = require('../../model/cart.modal')
const productSchema = require('../../model/product.model')
const max = 10;

const addToCart = async (req,res) => {

    try {

         
    const userId = req.session.user
    const { productId, quantity} = req.body

    const product = await productSchema.findById(productId)

    if(quantity > product.productQuantity){
        return res.status(404).send(`Only ${product.productQuantity} left` )
    }

    let cart = await cartSchema.findOne({userId})

    if(!cart){
        cart = new cartSchema({userId, products: []})
    }

    const index = cart.products.findIndex(i => i.productId.toString() === productId)
    
    if(index > -1){
        
        const total = cart.products[index].quantity + quantity;

        if(total > max ){
            return res.status(404).send(`You can only add up to ${max} per product`)
        }

        if(total > product.productQuantity){
            return res.status(404).send(`Only ${product.productQuantity} left`)
        }

        cart.products[index].quantity += quantity;
        cart.products[index].price = product.productPrice

    }else {
        
        if(quantity > product.productQuantity){
            return res.status(404).send(`You can Only add ${max} products`)
        }
        // console.log(typeof productId)
        cart.products.push({productId,quantity,price: product.productPrice})
    }

    await cart.save()

    res.status(200).json(cart);



    } catch (error) {
        console.log(`error from addtocart ${error}`)
    }

}


const increment = async (req,res)=>{

   try {

    const {productId } = req.body
    const userId = req.session.user

    const product = await productSchema.findById(productId)

    const cart = await cartSchema.findOne({userId})

    if(!cart){
        return res.status(404).send('cart not found')
    }

    const productInCart = cart.products.find(p => p.productId.toString() === productId)

    if(productInCart){

        const total = productInCart.quantity + 1

        if(total > max){
            return res.status(404).send(`Only ${max} can be added `)
        }

        if(total > product.productQuantity){
            return res.status(404).send(`Only ${product.productQuantity} left`)
        }

    productInCart.quantity = total;
    await cart.save()

    res.status(200).json(cart); 

    }else {
        res.status(404).send('productno found in cart')
    }

   } catch (error) {
      console.log(`error increment cart ${error}`)
   }


}


const decrement = async (req,res)=>{

    try {

    const userId = req.session.user

    const { productId } = req.body

    const cart = await cartSchema.findOne({userId})

    if(!cart){
        return res.status(404).send('Cart not found')
    }

    const index = cart.products.findIndex(p => p.productId.toString() === productId)

    if(index > -1){
        cart.products[index].quantity -=1

        if(cart.products[index].quantity <= 0 ){
            cart.products.splice(index,1)
        }

        await cart.save()

        res.status(200).json(cart);

        
    } else {
        return res.status(404).send('product not found')
    }


    } catch (error) {
        console.log(`errror decrement cart ${error}`)
    }

}

const removeFromCart = async (req,res)=>{

    try {

    const {productId} = req.body 
    const userId = req.session.user

    const cart = await cartSchema.findOne({userId})

    if(!cart){
        return res.status(404).send(`Cart not found`)
    }

    cart.products = cart.products.filter(p => p.productId.toString() !== productId )

    await cart.save()

    res.status(200).json(cart);

    } catch (error) {
        console.log(`error in remove from cart ${error}`)
    }

}

const renderCart = async (req,res)=>{
    const userId = req.session.user
    const cart = await cartSchema.findOne({userId}).populate('products.productId')

    for(product of cart.products){
        let currentProduct = await productSchema.findById(product.productId)

        if(currentProduct.productQuantity <= product.quantity){
            product.quantity = currentProduct.productQuantity;

        }

        product.price = currentProduct.productPrice;
        
        await cart.save();
    }

    res.render('user/cart',{title: 'Cart',user:req.session.user,cart})
}


module.exports = {
    addToCart,increment,decrement,removeFromCart,renderCart
}