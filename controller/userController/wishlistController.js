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

const renderWishlist = async (req,res)=>{

    try {
        
        const userId = req.session.user

        const wishlist = await wishlistSchema.findOne({userId}).populate('products.productId')

        if (wishlist && wishlist.products) {
            wishlist.products.reverse();
          }

        res.render('user/wishlist',{title:"Wishlist",wishlist,user:userId})

    } catch (error) {
        console.log(`error while rendering wishlist ${error}`)
    }

}


const updateWishlist = async (req,res)=>{

    try {
        
        const userId = req.session.user

        const wishlist = await wishlistSchema.findOne({userId}).populate('products.productId')

        if(wishlist && wishlist.products){
            wishlist.products.reverse();
        }

        res.render('user/wishlistRow',{wishlist,user:userId})

    } catch (error) {
        console.log(`error wishlist update ${error}`)
        res.status(500).send('failed to update wishlist')
    }

}


module.exports = {addToWishlist,renderWishlist,updateWishlist}