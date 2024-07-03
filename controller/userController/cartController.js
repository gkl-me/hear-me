const cartSchema = require("../../model/cart.modal");
const productSchema = require("../../model/product.model");
const offerSchema = require("../../model/offer.modal");
const findOffer = require("../../services/findOffer");
const { product } = require("../adminController/productController");
const max = 10;

// calculate the total price of the cart
function calculateTotalPrice(cart) {
  let totalPrice = 0;
  cart.products.forEach((product) => {
    if (product.discount) {
      totalPrice += product.discountMrp * product.quantity;
    } else {
      totalPrice += product.price * product.quantity;
    }
  });

  return totalPrice;
}

const addToCart = async (req, res) => {
  try {
    // gets the userId from the session
    const userId = req.session.user;

    // poductid and quantity from fetch request
    const { productId, quantity } = req.body;

    // finds the product using productId
    const product = await productSchema.findById(productId);

    // find offer for the product and dicount price
    let discount = await findOffer(productId);
    const discountMrp = product.productPrice * (1 - discount / 100).toFixed(2);

    // if product not found returns error
    if (product === null) {
      return res.status(404).send(`Product not Found`);
    }

    // check product count is greater and the added quantity
    if (quantity > product.productQuantity) {
      return res.status(404).send(`Only ${product.productQuantity} left`);
    }

    // finds the cart using userId
    let cart = await cartSchema.findOne({ userId });

    // if cart is not found creates new cart
    if (!cart) {
      cart = new cartSchema({ userId, products: [] });
    }

    //find if the product is already present in cart
    const index = cart.products.findIndex(
      (i) => i.productId.toString() === productId
    );

    // if product present
    if (index > -1) {
      // total quantity is calculated
      const total = cart.products[index].quantity + quantity;

      if (total > max) {
        return res
          .status(404)
          .send(`You can only add up to ${max} per product`);
      }

      if (total > product.productQuantity) {
        return res.status(404).send(`Only ${product.productQuantity} left`);
      }

      // update the price , quantity ,discount, discount price
      cart.products[index].quantity += quantity;
      cart.products[index].price = product.productPrice;
      cart.products[index].discount = discount.toFixed(2);
      cart.products[index].discountMrp = discountMrp.toFixed(2);
    } else {
      if (quantity > product.productQuantity) {
        return res.status(404).send(`You can Only add ${max} products`);
      }
      //  add new products into the cart
      cart.products.push({
        productId,
        quantity,
        price: product.productPrice,
        discount: discount.toFixed(2),
        discountMrp: discountMrp.toFixed(2),
      });
    }

    // find the total price of the cart
    cart.totalPrice = calculateTotalPrice(cart);
    if (cart.totalPrice < 500) {
      // set the shipping charge of based on the total price
      cart.shippingCharge = 100;
      cart.totalPrice += cart.shippingCharge;
    } else {
      cart.shippingCharge = 0;
    }

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.log(`error from addtocart ${error}`);
  }
};

// increment the quantity of the product in cart
const increment = async (req, res) => {
  try {
    //product id of the product
    const { productId } = req.body;
    const userId = req.session.user;

    // finds the product in product schema
    const product = await productSchema.findById(productId);

    // find the cart of the user
    const cart = await cartSchema.findOne({ userId });

    // if cart not found return an error
    if (!cart) {
      return res.status(404).send("cart not found");
    }

    // find the product in cart
    const productInCart = cart.products.find(
      (p) => p.productId.toString() === productId
    );

    // add the quantity or return error if condition not met
    if (productInCart) {
      // set total quantity
      const total = productInCart.quantity + 1;

      if (total > max) {
        return res.status(404).send(`Only ${max} can be added `);
      }

      if (total > product.productQuantity) {
        return res.status(404).send(`Only ${product.productQuantity} left`);
      }

      // set the quantity of product as total
      productInCart.quantity = total;
      await cart.save();

      res.status(200).json(cart);
    } else {
      res.status(404).send("productno found in cart");
    }
  } catch (error) {
    console.log(`error increment cart ${error}`);
  }
};

const decrement = async (req, res) => {
  try {
    const userId = req.session.user;

    const { productId } = req.body;

    // find the cart for the user
    const cart = await cartSchema.findOne({ userId });

    // return error if cart not found
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    // gets the index of the product in cart.products array
    const index = cart.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    // if product present
    if (index > -1) {
      // reduce the quantity of the product by 1
      cart.products[index].quantity -= 1;

      // remove the product if quantity is zero
      if (cart.products[index].quantity <= 0) {
        cart.products.splice(index, 1);
      }

      await cart.save();

      res.status(200).json(cart);
    } else {
      return res.status(404).send("product not found");
    }
  } catch (error) {
    console.log(`errror decrement cart ${error}`);
  }
};

// delete the product from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;

    const cart = await cartSchema.findOne({ userId });

    if (!cart) {
      return res.status(404).send(`Cart not found`);
    }

    // filter out the product not equal to the one you want to delete
    cart.products = cart.products.filter(
      (p) => p.productId.toString() !== productId
    );

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.log(`error in remove from cart ${error}`);
  }
};

const renderCart = async (req, res) => {
  // gets the user
  const userId = req.session.user;
  // find the cart of the user
  const cart = await cartSchema
    .findOne({ userId })
    .populate("products.productId");

  // if cart is present
  if (cart && cart.products.length > 0) {
    // check if the product price is same as the product schema
    for (let product of cart.products) {
      // get the product schema of current product
      let currentProduct = await productSchema.findById(product.productId);

      // checks for offer in the product
      let discount = await findOffer(product.productId);
      let discountMrp = currentProduct.productPrice * (1 - discount / 100);

      // check if product is out of stock
      if (currentProduct.productQuantity <= product.quantity) {
        product.quantity = currentProduct.productQuantity;
      }

      // update the new price
      product.price = currentProduct.productPrice;

      // update new discount
      product.discount = discount.toFixed(2);
      product.discountMrp = discountMrp.toFixed(2);
    }

    // calculate the total price
    cart.totalPrice = calculateTotalPrice(cart);

    // set the shipping charges if applied
    if (cart.totalPrice < 500) {
      cart.shippingCharge = 100;
      cart.totalPrice += cart.shippingCharge;
    } else {
      cart.shippingCharge = 0;
    }

    await cart.save();
  } else if (cart && cart.products.length === 0) {
    cart.shippingCharge = 0;
    cart.totalPrice = 0;

    await cart.save();
  }

  res.render("user/cart", { title: "Cart", user: req.session.user, cart });
};

module.exports = {
  addToCart,
  increment,
  decrement,
  removeFromCart,
  renderCart,
};
