const productSchema = require('../../model/product.model')
const wishlistSchema = require('../../model/wishlist.modal')

const addToWishlist = async (req,res) => {

    try {
        
        const userId = req.session.user
        const {productId} = req.body

        let wishlist = await wishlistSchema.findOne({userId})

        if(!wishlist){
            // console.log(1)
            wishlist = new wishlistSchema({userId,products:[]})

        }

        const index = wishlist.products.findIndex((product)=> product.productId.toString() === productId)
        const inWishlist = index !== -1

        if(inWishlist){
            // console.log(2)
            wishlist.products.splice(index,1)
        }else{
            // console.log(productId)
            // console.log(typeof productId)
            wishlist.products.push({productId})
        }

        await wishlist.save();
        res.status(200).json({inWishlist: !inWishlist})

    } catch (error) {
        console.log(`error from add to wishlist ${error}`)
    }
}


module.exports = {addToWishlist}