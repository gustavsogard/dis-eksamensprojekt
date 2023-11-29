require('dotenv').config();
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require('twilio')(accountSid, authToken);
const { decryptNum } = require('./crypt');
const messages = {
    created: 'Hey det er JOE. Din ordre er blevet modtaget, du vil få en besked når den er igangsat.',
    accepted: 'Hey det er JOE. Din ordre er igangsat, du vil få en besked når den er klar.',
    done: 'Hey det er JOE. Din ordre er klar til afhentning.',
    rejected: 'Hey det er JOE. Din ordre er blevet afvist, kontakt os venligst for mere information.',
}

const sendSMS = (phoneNum, status, encryptFlag = true) => {
    client.messages
        .create({
            body: messages[status],
            from: '+12052364320',
            to: encryptFlag ? decryptNum(phoneNum) : phoneNum
        })
}

module.exports = sendSMS;