const walletSchema = require('../../model/wallet.modal')
const orderSchema = require('../../model/order.modal')


const renderWallet = async (req,res)=>{

    const userId = req.session.user

    const wallet = await walletSchema.findOne({userId})

    let balance = 0 

    if(wallet){
        balance = wallet.balance
    }

    const walletHistory = wallet ? wallet.transaction : [];

    walletHistory.sort((a,b)=> b.date - a.date)

    res.render('user/wallet',{
        title: 'Wallet',
        user: userId,
        balance,
        walletHistory
    })

}


module.exports = {renderWallet}