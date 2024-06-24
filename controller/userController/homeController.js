const productSchema = require('../../model/product.model')
const collectionSchema = require('../../model/collection.model')
const wishlistSchema = require('../../model/wishlist.modal')


const home= async (req,res)=> {

    try {
        

        const product = await productSchema.find({isActive: true}).sort({createdAt: -1}).limit(3)

        if(req.session.user){

            const userId = req.session.user

            const wishlist = await wishlistSchema.findOne({userId})

            return res.render('user/home',{title:'Home',product,user:userId,wishlist})

        }else{
            
            return res.render('user/home',{title:'Home',product, user:req.session.user})

        }

        // res.render('user/home',{title:'Home',product, user:req.session.user })

        
    } catch (error) {
        console.log(`error while rendering home ${error}`)
    }

}

const explore = async(req,res)=>{
    try {

        const userId =req.session.user

        const category = await collectionSchema.find({ isActive: true });

        const allCategory = category.map(item => item.collectionName);

        const selectedCategory = req.query.collections || allCategory;

        const minPrice = parseInt(req.query.minPrice) || 0;

        const maxPrice = parseInt(req.query.maxPrice) || 100000;

        const productRating = parseInt(req.query.ratings) || 0;

        const availability = req.query.availability === 'in-stock' ? { productQuantity: { $gt: 0 } } : {};

        const sortOption = req.query.sort || 'latest';

        const userSearch = req.query.userSearch || '';

        const productsPerPage = 9;

        const currentPage = parseInt(req.query.page) || 0;

        let query = {
            productName: { $regex: userSearch, $options: 'i' },
            productCollection: { $in: selectedCategory },
            isActive: true,
            productPrice: { $gte: minPrice, $lte: maxPrice },
            ...availability,
        };


        if (productRating > 0) {
            query.productRating = { $gte: productRating };
        }


        let products = await productSchema.find(query);
        

        switch (sortOption) {
            case 'price-high-low':
                products.sort((a, b) => b.productPrice - a.productPrice);
                break;
            case 'price-low-high':
                products.sort((a, b) => a.productPrice - b.productPrice);
                break;
            case 'latest':
                products.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'a-z':
                products.sort((a, b) => a.productName.localeCompare(b.productName));
                break;
            case 'z-a':
                products.sort((a, b) => b.productName.localeCompare(a.productName));
                break;
        }

        const startIndex = currentPage * productsPerPage;
        const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

        const productsCount = await productSchema.countDocuments(query);

        const wishlist = await wishlistSchema.findOne({userId})

        res.render('user/explore', {
            title: 'Explore',
            product: paginatedProducts,
            category,
            user: req.session.user,
            currentPage,
            totalPages: Math.ceil(productsCount / productsPerPage),
            wishlist
        });
    } catch (err) {
        console.log(`Error rendering home page: ${err}`);
        res.status(500).send('Internal Server Error');
    }
}


module.exports = {home,explore};