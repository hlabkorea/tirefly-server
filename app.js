//server.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./api/config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./api/config/jwt.js");
const process = require("process");
const morgan = require('morgan');

const server = app.listen(3001, () => {
	console.log('Start server');
});

app.use(morgan('combined', 
        {skip: function (req, res) {
            if (req.url == '/') {
                return true;
            } else {
                return false;
            }
        }
    }));

app.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));
app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        if (err) 
            return res.status(400).json({status: 400, data: {err: err}, message: "fail"});

        next();
    });
});
app.use(bodyParser.json({ limit: "100mb" }));
// parse application/x-www-form-urlencoded


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
//app.use('/crud', require('./api/crudSample.js'));
app.use('/login', require('./api/login.js'));
app.use('/logout', require('./api/logout.js'));
app.use('/user', require('./api/user.js'));
app.use('/category', require('./api/category.js'));
app.use('/acc', require('./api/acc.js'));

app.use('/my_category', require('./api/my_category.js'));
app.use('/my_acc', require('./api/my_acc.js'));
app.use('/my_video', require('./api/my_video.js'));
app.use('/my_program', require('./api/my_program.js'));

app.use('/video', require('./api/video.js'));
app.use('/video_acclist', require('./api/video_acclist.js'));
app.use('/video_list', require('./api/video_list.js'));
app.use('/video_history', require('./api/video_history.js'));
app.use('/teacher', require('./api/teacher.js'));
app.use('/review', require('./api/review.js'));
app.use('/music', require('./api/music.js'));

app.use('/program', require('./api/program.js'));
app.use('/program_list', require('./api/program_list.js'));
app.use('/program_history', require('./api/program_history.js'));

app.use('/pass', require('./api/pass.js'));
app.use('/payment', require('./api/payment.js'));

app.use('/faq', require('./api/faq.js'));
app.use('/inquiry', require('./api/inquiry.js'));
app.use('/notice', require('./api/notice.js'));

app.use('/preorder', require('./api/preorder.js'));
app.use('/pwdAuth', require('./api/pwdAuth.js')); //pwd_auth로 수정

app.use('/membership', require('./api/membership.js'));
app.use('/membership_group', require('./api/membership_group.js'));

app.use('/product', require('./api/product.js'));
app.use('/product_img_list', require('./api/product_img_list.js'));
app.use('/product_option_list', require('./api/product_option_list.js'));
app.use('/my_basket', require('./api/my_basket.js'));

app.use('/main_slide', require('./api/main_slide.js'));
app.use('/newsletter', require('./api/newsletter.js'));

app.use('/admin', require('./api/admin.js'));
app.use('/admin_login', require('./api/admin_login.js'));
app.use('/admin_log', require('./api/admin_log.js'));

app.use('/stock', require('./api/stock.js'));
app.use('/qt_version', require('./api/qt_version.js'));
app.use('/vision', require('./api/vision.js'));
