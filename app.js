//server.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
require('dotenv').config(); //process.NODE_ENV

const server = app.listen(3001, () => {
	console.log('Start server');
});

//require('dotenv').config();

app.use(morgan('combined', {
    skip: function (req, res) {
        if (req.url == '/') {
            return true;
        } else {
            return false;
        }
    }
}));

app.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        if (err) 
            return res.status(400).json({status: 400, data: {err: err}, message: "fail"});

        next();
    });
});

app.use(express.urlencoded( {extended : false } ));
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); //cross origin
	res.header('Access-Control-Allow-Headers', 'content-type, x-access-token, token');
	next();
});
app.use(express.static("views"));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// API
app.use('/crud', require('./api/crudSample.js'));
app.use('/user', require('./api/user.js'));
app.use('/notice', require('./api/notice.js'));
app.use('/event', require('./api/event.js'));
app.use('/login', require('./api/login.js'));
app.use('/review', require('./api/review.js'));
app.use('/reservation', require('./api/reservation.js'));
app.use('/product', require('./api/product.js'));
app.use('/favorite', require('./api/favorite.js'));
app.use('/coupon', require('./api/coupon.js'));
app.use('/myCoupon', require('./api/myCoupon.js'));
app.use('/myCar', require('./api/myCar.js'));
app.use('/mnfct', require('./api/mnfct.js'));
app.use('/order', require('./api/order.js'));
app.use('/myPlace', require('./api/myPlace.js'));
app.use('/push', require('./api/push.js'));
app.use('/keep', require('./api/keep.js'));
