const path = require('path');

const express = require('express');

const shopController = require('../controllers/shopController')
const isAuth = require('../middleware/is_auth');

const router = express.Router();

// Main Page
router.get('/', shopController.getIndex);

// Product Page
router.get('/products', shopController.getProducts);

// Product Detail Page
router.get('/products/:productId', shopController.getProduct);

// To reach Cart Page
router.get('/cart', isAuth, shopController.getCart);

// For add Cart Page
router.post('/cart', isAuth, shopController.postCart);

// For delete Cart Page
router.post('/cart_delete_item', isAuth, shopController.postCartDelete);

// To reach Checkout Page
router.get('/checkout', isAuth, shopController.getCheckout);


router.get('/checkout/success', shopController.getCheckoutSuccess);


router.get('/checkout/cancel', shopController.getCheckout);

// To reach Order page
router.get('/orders', isAuth, shopController.getOrders);

// For Invoices
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;