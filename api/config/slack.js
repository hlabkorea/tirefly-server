const SLACK_API_KEY="xoxb-2897262668209-3122641807616-GTNlpOmdRBYcvS4NxzFJP61W";
const API_TOKEN = SLACK_API_KEY;
//const API_TOKEN = process.env.SLACK_API_KEY;

const axios = require('axios');
const qs = require('qs');
const apiUrl = 'https://slack.com/api';

async function sendSlackMsg(dest,message){
    let messageArgs = {
        token: API_TOKEN,
        channel: dest, 
        text: message,
    };
    slackPost(messageArgs);
};

async function getUserList(){
    const result = await axios({
        url: apiUrl + "/users.list",
        method: "get",
        headers: {
            "Authorization": "Bearer " + API_TOKEN
        }
    });

    const members = result.data.members;
    var memberList = [];

    for(var i in members){
        if(members[i].is_bot == false){ // bot은 제외
            var member = {};
            member.id = members[i].id;
            if(members[i].real_name == undefined) // 이름이 없는 사용자 처리
                member.name = "이름 없는 사용자";
            else
                member.name = members[i].real_name;
            member.nickName = members[i].name;
            member.email = members[i].email;
            memberList.push(member);
        }
    }

    return memberList;
}

const slackPost = async(args) => { 
    const result = await axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(args));
    try {
        if(result.data.ok == false)
            await sendSlackMsg('#server-error', "● slack-채팅봇 에러: " + result.data.error);
        
        console.log(result.data);
    } catch(e) {
        console.log(e);
    }
};

module.exports = {sendSlackMsg, getUserList}
