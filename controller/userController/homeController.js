const productSchema = require('../../model/product.model')
const collectionSchema = require('../../model/collection.model')
const wishlistSchema = require('../../model/wishlist.modal')


const home= async (req,res)=> {

    try {
        

        const product = await productSchema.find().sort({createdAt: -1}).limit(3)

        res.render('user/home',{title:'Home',product, user:req.session.user })

        
    } catch (error) {
        console.log(`error while rendering home ${error}`)
    }

}

const explore = async(req,res)=>{
    try {

        const search = req.query.collection || "";
        
        const product = await productSchema.find({productCollection: {$regex : search, $options: 'i'}})

        if(req.session.user){

            const userId = req.session.user

            const wishlist = await wishlistSchema.findOne({userId})

            return res.render('user/explore',{title:'Explore',product,user:userId,wishlist})

        }else{
            
            return res.render('user/explore',{title:'explore',product, user:req.session.user})

        }


    } catch (error) {
        console.log(`error from explore rendering ${error}`)
    }
}


module.exports = {home,explore};