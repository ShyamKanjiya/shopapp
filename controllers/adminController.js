const fileHelper = require('../util/file')

const Product = require('../models/product');

const { validationResult } = require('express-validator');

const ITEMS_PER_PAGE = 3;

// To get products in admin product page
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find({ userId: req.user._id })
        .count()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find({ userId: req.user._id })
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        });
};

// To display add product page
exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit_product', {
        pageTitle: 'Add Product',
        path: '/admin/add_product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

// To save data from add product
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {
        return res.status(422).render('admin/edit_product', {
            path: '/admin/add_product',
            pageTitle: 'Add Product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Atteched file is not an image.',
            validationErrors: []
        });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit_product', {
            path: '/admin/add_product',
            pageTitle: 'Add Product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
    });
    product.save()
        .then(() => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        });
};

// To get data for edit product
exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit_product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit_product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        });
};

// To save updated data 
exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit_product', {
            path: '/admin/edit_product',
            pageTitle: 'Edit Product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }


    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image, path;
            }
            return product.save()
                .then(() => {
                    console.log('UPDATED PRODUCT!');
                    res.redirect('/admin/products');
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpsStatusCose = 500;
                    return next(error);
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        });
};

// To delete the product
// exports.postDeleteProduct = (req, res, next) => {
//     const prodId = req.body.productId;

//     Product.findById(prodId)
//         .then(product => {
//             if (!product) {
//                 return next(new Error('Product not found'));
//             }
//             fileHelper.deleteFile(product.imageUrl);
//             return Product.deleteOne({ _id: prodId, userId: req.user._id });
//         })
//         .then(() => {
//             console.log('Deleted Product');
//             res.redirect('/admin/products');
//         })
//         .catch(err => {
//             const error = new Error(err);
//             error.httpsStatusCose = 500;
//             return next(error);
//         });
// };

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            console.log('Deleted Product');
            res.status(200).json({ message: 'Success!' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Deleting Product failed.' });
        });
};