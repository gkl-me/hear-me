
const userSchema = require('../../model/user.modal')

const users = async (req,res)=> {

    try {
        
        const search = req.query.search || "" ;
        const page = parseInt(req.query.page) || 0;
        const limit = 8;

        const filterQuery = {name: {$regex: search, $options: 'i'}}

        const user = await userSchema.find(filterQuery)
            .sort({updatedAt: -1})
            .skip(page*limit)
            .limit(limit)

        const totalUser = await userSchema.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalUser/limit)

        res.render('admin/user',{title: 'Customers',
            user,
            totalPages,
            currentPage:page,
            search,
            limit
        })

    } catch (error) {
        console.log(`Error while loading user in admin ${error}`)
    }

}

const status = async (req,res)=> {

    try {
        
        const {id,status} = req.query;
        const newStatus = !(status === 'true')

        await userSchema.findByIdAndUpdate(id,{isActive: newStatus})
        res.redirect('/admin/users')

    } catch (error) {
        console.log(`error while changing status of user ${error}`)
    }

}

module.exports ={ users,status};