const productSchema = require('../../model/product.model')
const collectionSchema = require('../../model/collection.model')
const wishlistSchema = require('../../model/wishlist.modal')
const reviewSchema = require('../../model/review.modal')
const findOffer = require('../../services/findOffer')


const home= async (req,res)=> {

    try {
        

        const products = await productSchema.find({isActive: true}).sort({createdAt: -1}).limit(3)

        const productsWithDiscounts = await Promise.all(products.map(async p =>{
            const discount = await findOffer(p.id)
            const productDiscount = p.toObject()
            productDiscount.discount = discount
            productDiscount.discountMrp = (p.productPrice * (1- discount/100)).toFixed(2)

             // Aggregate ratings
             const reviews = await reviewSchema.find({ productId: p._id });
             const averageRating = reviews.length > 0 ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1) : 0;
             productDiscount.averageRating = averageRating;
 
             return productDiscount;

        } ))

        if(req.session.user){

            const userId = req.session.user

            const wishlist = await wishlistSchema.findOne({userId})

            return res.render('user/home',{title:'Home',product:productsWithDiscounts,user:userId,wishlist})

        }else{
            
            return res.render('user/home',{title:'Home',product:productsWithDiscounts, user:req.session.user})

        }

        // res.render('user/home',{title:'Home',product, user:req.session.user })

        
    } catch (error) {
        console.log(`error while rendering home ${error}`)
    }

}

const explore = async (req, res) => {
    try {
        const userId = req.session.user;

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
            ...availability,
        };

        let products = await productSchema.find(query);

        // Apply discounts and aggregate ratings
        const productsWithDiscountsAndRatings = await Promise.all(products.map(async p => {
            const discount = await findOffer(p._id);
            const productDiscount = p.toObject();
            productDiscount.discount = discount;
            productDiscount.discountMrp = (p.productPrice * (1 - discount / 100)).toFixed(2);

            // Aggregate ratings
            const reviews = await reviewSchema.find({ productId: p._id });
            const averageRating = reviews.length > 0 ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1) : 0;
            productDiscount.averageRating = averageRating;

            return productDiscount;
        }));

        // Filter products based on discounted price and ratings
        const filteredProducts = productsWithDiscountsAndRatings.filter(p => {
            const discountedPrice = parseFloat(p.discountMrp);
            return discountedPrice >= minPrice && discountedPrice <= maxPrice && p.averageRating >= productRating;
        });

        // Sort products
        switch (sortOption) {
            case 'price-high-low':
                filteredProducts.sort((a, b) => parseFloat(b.discountMrp) - parseFloat(a.discountMrp));
                break;
            case 'price-low-high':
                filteredProducts.sort((a, b) => parseFloat(a.discountMrp) - parseFloat(b.discountMrp));
                break;
            case 'latest':
                filteredProducts.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'a-z':
                filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
                break;
            case 'z-a':
                filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName));
                break;
        }

        const startIndex = currentPage * productsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

        const productsCount = filteredProducts.length;

        const wishlist = await wishlistSchema.findOne({ userId });

        res.render('user/explore', {
            title: 'Explore',
            product: paginatedProducts,
            category,
            user: req.session.user,
            currentPage,
            totalPages: Math.ceil(productsCount / productsPerPage),
            wishlist,
            appliedFilters: req.query // To show applied filters
        });
    } catch (err) {
        console.log(`Error rendering home page: ${err}`);
        res.status(500).send(`Internal Server Error ${err}`);
    }
};




module.exports = {home,explore};