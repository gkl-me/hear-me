const userSchema = require('../model/user.modal')

async function isUser(req, res, next) {
    try {
        if (req.session.user) {
            const user = await userSchema.findById(req.session.user);

            if (user) {
                if (user.isActive) {
                    next();
                } else {
                    req.session.user = '';
                    req.flash('error', 'User is blocked by admin');
                    res.redirect('/user/login');
                }
            } else {
                req.session.user = '';
                next()
            }
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.log(`User session error ${error}`);
    }
}




module.exports=isUser