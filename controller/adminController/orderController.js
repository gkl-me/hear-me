const orderSchema = require('../../model/order.modal')


const renderOrder = async (req,res)=>{

    try {

        const order = await orderSchema.find().populate('products.productId').populate('userId')

        res.render('admin/orders',{title:'Order',order})

    } catch (error) {
        console.log(`error from order ${error}`)
    }

}

const editOrder = async (req,res)=>{

    try {

        const orderId = req.params.id

        

        const order = await orderSchema.findById(orderId).populate('products.productId')

        res.render('admin/orderEdit',{title: 'Edit Order',order})
        
    } catch (error) {
        console.log(`error `)
    }
}

const updateStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const newStatus = req.body.status;

        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }


        const previousStatuses = ['processing', 'shipped', 'delivered','cancelled', 'returned'];
        const currentIndex = previousStatuses.indexOf(order.status);
        const newIndex = previousStatuses.indexOf(newStatus);

        if (newIndex < currentIndex) {
            return res.status(400).send(`Order has already been ${order.status}`);
        }

        await orderSchema.findByIdAndUpdate(orderId, { $set: { status: newStatus } });

        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(`Error from updateStatus: ${error}`);
        res.status(500).send('Internal server error');
    }
};


module.exports = {renderOrder,editOrder,updateStatus}