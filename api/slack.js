const axios = require('axios');
const qs = require('qs');
// const API_TOKEN = "xoxb-3097089176929-3069873763175-0xlXnM7OgrwfdNJg2MknLJWe";
const API_TOKEN = process.env.SLACK_API_KEY;
const signingSecret = process.env.SIGNINGSECRET;
const apiUrl = 'https://slack.com/api';

// front page input box ( type , channel or userID , message ) 작업예정
function slackMessage(type,channel,message){
    let messageArgs = {
        token: API_TOKEN,
        channel: type + channel,
        text: message,
    };
    var method = "/chat.postMessage"
    slackPost(method, messageArgs);
};

function deletMessage(channel, messageId){
    let Args = {
        token : API_TOKEN,
        channel : `#${channel}`,
        ts : messageId,
    }
    var method = "/chat.delete"
    slackPost(method, Args)
}

const slackPost = async(method,args) => { 
    // const result = await axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(args));
    const result = await axios.post(`${apiUrl}${method}`, qs.stringify(args));
    try {
        console.log(result.data);
        } catch(e) {
        console.log(e);
    }
};

module.exports = {slackMessage ,deletMessage}