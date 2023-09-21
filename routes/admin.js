const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/adminController');
const isAuth = require('../middleware/is_auth');

const router = express.Router();

// /admin/add_product => GET
router.get('/add_product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add_product => POST
router.post('/add_product', [
    body('title','Please enter valid title.')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price','Please enter valid price.')
        .isNumeric(),
    body('description','Please enter valid description.')
        .isLength({ min: 5, max: 400 })
], isAuth, adminController.postAddProduct);

// /admin/edit_product => GET
router.get('/edit_product/:productId', isAuth, adminController.getEditProduct);

// /admin/edit_product => POST
router.post('/edit_product', [
    body('title','Please enter valid title.')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price','Please enter valid price.')
        .isNumeric(),
    body('description','Please enter valid description.')
        .isLength({ min: 5, max: 400 })
], isAuth, adminController.postEditProduct);

// /admin/delete_product => POST
// router.post('/delete_product', isAuth, adminController.postDeleteProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;