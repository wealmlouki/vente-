var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var user = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
    user.find(function(err, user) {
        if (err) return next(err);
        res.json(user);
    });
});
router.post('/login', function(req, res, next) {
    user.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length < 1) {
                res.status(401).json({
                    message: 'Auth Failed'
                });
            }
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    res.status(401).json({
                        message: 'Auth Failed'
                    });
                }
                if (result) {
                    const token = jwt.sign({
                            email: user[0].email,
                            userId: user[0]._id
                        },
                        process.env.JWT_KEY, {
                            expiresIn: "1h"
                        }
                    );
                    res.status(200).json.parse({
                        message: 'Auth Successful',
                        token: token
                    });
                } else {
                    res.status(401).json({
                        message: 'Auth Failed'
                    });
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });

});

router.post('/signup', function(req, res, next) {
    user.find({ email: req.body.email })
        .exec().then(users => {
            if (users.length >= 1) {
                return res.status(409).json({
                    message: "Mail exists"
                })
            } else {
                var salt = crypto.randomBytes(128).toString('base64');
                crypto.pbkdf2(user.password, salt, 10000, 512, function(err, derivedKey) {
                        user.password = derivedKey;
                        next();
                    }),
                    bcrypt.hash(req.body.password, salt(10), (err, hash) => {
                        if (err) {

                            return res.json({
                                err: err
                            });
                        } else {
                            const user = new user({
                                _id: new mongoose.Types.ObjectId(),
                                email: req.body.email,
                                password: hash
                            });
                            user.save().then(result => {
                                    console.log(result);
                                    res.status(201).json({
                                        message: "User Created"
                                    })
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.status(500).json({
                                        err: err
                                    });
                                });
                        }


                    });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                err: err
            });
        });
})


module.exports = router;