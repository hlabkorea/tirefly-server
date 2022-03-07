const express = require('express')
const { con } = require('./config/database.js');
const jwt = require('jsonwebtoken');
const secretObj = require('./config/jwt.js');
const api = express.Router();
const sha256 = require('sha256');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { axios } = require('axios');

const url = "https://kauth.kakao.com/oauth/authorize?client_id={REST_API_KEY}&redirect_uri={REDIRECT_URI}&response_type=code"
const redirect_uri = "http://127.0.0.1/kakao_login.html";
const kakaoToken = "0da8b555c77a9a627ae0d24fe085d739"

//kakao_login
api.post('/kakaoLogin',
    async function(req, res) {
        const error = getError(req, res);
        if(error.isEmpty()) {
            try {
                const info = await axios.get('https://kapi.kakao.com/v2/user/me',{
                    headers: {Authorization: 'Bearer ' + token}
                })
            } catch (err) {
                throw err;
            }
        }
    }
)