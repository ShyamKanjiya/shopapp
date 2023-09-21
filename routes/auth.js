const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/authController');
const User = require('../models/user')

const router = express.Router();

// To reach Login Page
router.get('/login', authController.getLogin);

// For Login
router.post('/login',
    [check('email')
        .isEmail()
        .withMessage('Invalid email or password')
        .normalizeEmail(),
    body('password', 'Invalid email or password.')
        .isLength({ min: 8, max: 16 })
        .isAlphanumeric()
        .trim()
    ],
    authController.postLogin);

// For Logout
router.post('/logout', authController.postLogout);

// To reach Sign up Page
router.get('/signup', authController.getSignUp);

// For Sign up
router.post('/signup',
    [check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail exists already, plece enter diffrent one.');
                    }
                });
        })
        .normalizeEmail(),
    body('password', 'Please enter an alphanumerics password with least 8 and max 16 characters.')
        .isLength({ min: 8, max: 16 })
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password and Confirm password doesn\'t match.');
            }
            return true;
        })
    ],
    authController.postSignUp);

// To reach Reset Password Page
router.get('/reset', authController.getReset);

// For send mail
router.post('/reset', authController.postReset);

// To reach New Password Page
router.get('/reset/:token', authController.getNewPassword);

// For change Password
router.post('/new_password',
    [body('password', 'Please enter an alphanumerics password with least 8 amd max 16 characters.')
        .isLength({ min: 8, max: 16 })
        .isAlphanumeric(),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password and Confirm password doesn\'t match.');
        }
        return true;
    })
    ],
    authController.postNewPassword);

module.exports = router;