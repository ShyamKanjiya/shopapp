const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const moment = require('moment-timezone');

const User = require('../models/user');
const user = require('../models/user');
const { errorMonitor } = require('stream');

let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mrpopcornbox@gmail.com',
        pass: 'untdspmjraayoznr'
    }
});

// Go to login
exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

// Login post
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email or password.',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });

        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        })
};

// Logout post
exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};

// Go to sign up
exports.getSignUp = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    });
};

// To save Sign up data
exports.postSignUp = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name: name,
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }
    bcrypt.hash(password, 12)
        .then(hashedPasword => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPasword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
            return mailTransporter.sendMail({
                from: 'shop@node-complete.com',
                to: email,
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up!</h1>'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        });
};

// Go to Forgot password
exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

// For sending Mail
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                // For 1 hour token 
                const expiration = Date.now() + 3600000
                console.log(expiration);
                user.resetTokenExpiration = expiration;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                mailTransporter.sendMail({
                    from: 'shop@node-complete.com',
                    to: req.body.email,
                    subject: 'Password Reset',
                    html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:8080/reset/${token}">link</a> to set a new password.</p>`
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpsStatusCose = 500;
                return next(error);
            });
    });
};

// Go to New Password Page
exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new_password', {
                path: '/new_password',
                pageTitle: 'New Password',
                errorMessage: message,
                oldInput: {
                    password: '',
                    confirmPassword: '',
                    userId: user._id.toString(),
                    token: token,
                },
                validationErrors: []
            });
        })
        .catch(err => {
            res.render('auth/cant_reach', {
                path: '/cant_reach',
                pageTitle: 'This site can\'t be reached'
            });
            console.log(err);
        });
};

// For sending Mail
exports.postNewPassword = (req, res, next) => {
    const password = req.body.password;
    const userId = req.body.userId;
    const token = req.body.token;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/new_password', {
            path: '/new_password',
            pageTitle: 'New Password',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                password: password,
                confirmPassword: req.body.confirmPassword,
                userId: user._id.toString(),
                token: token,
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    user.password = hashedPassword;
                    user.resetToken = null;
                    user.resetTokenExpiration = null;
                    return user.save();
                })
                .then(result => {
                    res.redirect("/login");
                })
                .catch(err => {
                    console.log(err)
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpsStatusCose = 500;
            return next(error);
        })
};