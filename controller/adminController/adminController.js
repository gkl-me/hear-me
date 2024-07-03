const orderSchema = require('../../model/order.modal')
const productSchema = require('../../model/product.model')
const moment = require('moment')
// const PDFdocs = require('pdfkit')
const PDFdocs = require('pdfkit-table')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

//admin routes

const admin = (req,res)=>{
    try {
        res.redirect('/admin/login')
    } catch (error) {
        console.log(`error from admin ${error}`)
    }
}

// login get request 

const login = (req,res)=>{
    try {
        if(req.session.admin){
            res.redirect('/admin/home')
        }else{
            res.render('admin/login',{title: "Login"})
        }
        
    } catch (error) {
        console.log(`error from admin login ${error}`)
    }
    
}

//admin login post request 

const loginPost = (req,res)=>{
    try {
        if(req.body.adminId === process.env.ADMIN_ID && req.body.password=== process.env.ADMIN_PASS){
            req.session.admin = req.body.adminId
            res.redirect('/admin/home')
        }else{
            req.flash("error","Invalid Credentials")
            res.redirect('/admin/login')
        }
        
    } catch (error) {
        console.log(`error from login post ${error}`)
    }
    
}

//admin home get request

const home = async (req,res)=>{
   try {

    const orderSummary = await orderSchema.aggregate([
        {
            $match:{
                status: {$in : ['processing','shipped','delivered'] }
            }
        },
        {
            $unwind: '$products'
        },
        {
            $group: {
                _id: null,
                totalProductQuantity: {$sum : '$products.quantity'},
                totalCouponDiscount:{$sum: '$couponDiscount'},
                totalDiscountedPrice:{
                    $sum:{
                        $multiply: [
                            {$subtract:  ['$products.price','$products.discountMrp']},
                            '$products.quantity'
                        ]
                    }
                }
            }
        }

    ])

    const orderCount = await orderSchema.countDocuments()
    const orderTotalPrice = await orderSchema.aggregate([
        {
            $match:{
                status: {$in: ['processing','shipped','delivered']}
            }
        },
        {
            $group:{
                _id: null,
                totalPrice:{$sum: '$totalPrice'}
            }
        }
    ])


    //find the best seller 
    const productSale = await orderSchema.aggregate([
        {$unwind: "$products"},
        {$group : {_id:'$products.productId',totalQuantity:{$sum: "$products.quantity"}}},
        {$sort: {totalQuantity: -1}}
    ])

    const productsSaleId = productSale.map(sale => sale._id)
    // console.log(productsSaleId)
    
    const products = await productSchema.find({_id: {$in: productsSaleId}})

    const bestSellerProducts = productsSaleId.map(id => products.find(product => product.id.toString() === id.toString()))

    const bestSellerCollections = new Map();
    bestSellerProducts.forEach(item => {
        if(bestSellerCollections.has(item.productCollection)){
            bestSellerCollections.set(item.productCollection,bestSellerCollections.get(item.productCollection)+1)
        }else{
            bestSellerCollections.set(item.productCollection,1)
        }
    })





    res.render('admin/home',{title: "Home",orderSummary,orderCount,orderTotalPrice,bestSellerProducts,bestSellerCollections})
   } catch (error) {
    console.log(`error from home ${error}`)
   }
}


const generateReport = async (req,res)=>{

    const { timeFrame, year, month, startDate, endDate, reportType } = req.body
    // console.log(req.body)
    let start,end ;
    if(timeFrame === 'today'){
        start = moment().startOf('day').toDate();
        end = moment().endOf('day').toDate();
    }else if(timeFrame === 'this-week'){
        start = moment().startOf('week').toDate()
        end = moment().endOf('day').toDate()
    }else if(timeFrame === 'this-month'){
        console.log(month)
        const monthIndex = month+1;
        start = moment().year(year).month(month).startOf('month').toDate()
        end = moment().year(year).month(month).endOf('month').toDate();
    }else if(timeFrame === 'this-year'){
        start = moment(`${year}`).startOf('year').toDate()
        end = moment(`${year}`).endOf('year').toDate()
    }else if(timeFrame === 'custom'){
        start = moment(`${startDate}`).toDate()
        end = moment(`${endDate}`).toDate()
    }


    try {

        
        const orderDetails = await orderSchema.find({createdAt : {$gte: start , $lte: end}}).sort({createdAt : -1})

        // console.log(orderDetails)

        if(reportType === 'pdf'){
            await generatePdf(orderDetails,res)
        }else if (reportType === 'excel') {
            await generateExcel(orderDetails, res);
        }
    } catch (error) {
        console.log(`error from generate sales report ${error}`)
    }




}

async function generatePdf(orders, res) {
    
    const totalOrders = orders.length
    const totalRevenue = orders
    .filter(order => order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'returned')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

    const doc = new PDFdocs();

    const filename = 'sales-report.pdf';

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.font("Helvetica-Bold").fontSize(36).text("Hear ME", { align: "center", margin: 10 });

    doc.moveDown();

    // doc.text(`Total Orders : ${totalOrders}`);
    doc.fontSize(10).fillColor("red").text(`Total Revenue : Rs ${totalRevenue.toFixed(2)}`);
    doc.fontSize(10).fillColor("black").text(`Total Orders : ${totalOrders}`);

    doc.moveDown();

    doc.moveDown(); // Move down after the title
    doc.font("Helvetica-Bold").fillColor("black").fontSize(14).text(`Sales Report`, { align: "center", margin: 10 });
    // doc.fontSize(12).text(`From ${startDate} To ${endDate}`, { align: "center", margin: 10 });

    doc.moveDown();

    const tableData = {
        headers: [
            'Order Id',
            'Address',
            'Payment Method',
            'Order Status',
            'Total'
        ],
        rows: orders.map((order) => {
            return [
                order._id,
                order.address.addressLine + '\n' + order.address.city + ' ' + order.address.state + "\n" + "Pincode :" + order.address.pincode,
                order.paymentMethod,
                order.status,
                'RS:' + order.totalPrice
            ];
        })
    };

    // console.log('Generated Table Data:', tableData); // Log the table data for debugging

    try {
        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(8),
            hLineColor: '#b2b2b2',
            vLineColor: '#b2b2b2',
            textMargin: 2,
        });
    } catch (error) {
        console.error('Error generating table:', error); // Log any errors in table generation
    }

    doc.end();
}


// excel sales report generate 

async function generateExcel(orders, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "Pincode", key: "pin", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Order Date", key: "orderDate", width: 18 },
        { header: "Total", key: "total", width: 15 },
    ];

    let totalSale = 0;
    let totalOrders = 0;

    for (const order of orders) {
        const orderId = order._id;
        const orderDate = order.createdAt;
        const address = order.address?.addressLine + ', ' + order.address?.city;
        const pin = order.address.pincode;
        const status = order.status;
        const total = order.totalPrice;

        worksheet.addRow({
            orderId,
            orderDate,
            address,
            pin,
            status,
            total
        });


        totalSale += order.totalPrice;
        totalOrders++;
    }

    worksheet.addRow({
        orderId: "Total",
        productName: "",
        price: "",
        quantity: "",
        status: "",
        address: "",
        pin: "",
        orderDate: ""
    });

    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true };
    worksheet.getCell(`A${worksheet.rowCount}`).value = `Total Orders: ${totalOrders}`;

    worksheet.getCell(`E${worksheet.rowCount}`).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(`E${worksheet.rowCount}`).font = { bold: true };
    worksheet.getCell(`E${worksheet.rowCount}`).value = `Total Revenue: ${totalSale.toFixed(2)}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const excelBuffer = Buffer.from(buffer);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    res.send(excelBuffer);
}




//admin logout request

const logout = (req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(`error while admin logout ${err}`)
        }else{
            res.redirect("/admin/login")
        }
    })
}


const salesChart = async (req,res)=>{

    try {
        const orders = await orderSchema.find({
            status: { $in: ['processing', 'shipped', 'delivered'] }
          });

        // Initialize arrays for each chart type
        let salesData = Array.from({ length: 12 }, () => 0); // Initialize with zeros for each month
        let revenueData = Array.from({ length: 12 }, () => 0); // Initialize with zeros for each month
        let productsData = Array.from({ length: 12 }, () => 0); // Initialize with zeros for each month

        // Aggregate data by month
        orders.forEach(order => {
            const month = order.createdAt.getMonth();
            salesData[month]++;
            revenueData[month] += order.totalPrice;
            for(product of order.products){
                productsData[month] += product.quantity;

            }
        });

        // Send data to frontend
        res.json({
            salesData,
            revenueData,
            productsData
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}





//exporting the admin controllers

module.exports={login,loginPost,home,admin,logout,generateReport,salesChart}