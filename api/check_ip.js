const express = require('express');
const geoip = require('geoip-country');
const api = express.Router();

api.get('/', async function (req, res) {
    try{
        var ip = "43.133.64.160"; //www.naver.com
        var geo = geoip.lookup(ip);
        console.log(geo);
        console.log(geo.country);
        if(geo != null && geo.country != 'KR'){
            res.status(403).json({
                status: 403,
                data: "Unauthorized",
                message: "fail"
            });

            return false;
        }

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

module.exports = api;