require('dotenv').config();
// Twilio Credentials from .env
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
// require the Twilio module and create a client
const client = require('twilio')(accountSid, authToken);

const { decryptNum } = require('./crypt');
// Messages to send to the customer for each status
const messages = {
    created: 'Hey det er JOE. Din ordre er blevet modtaget, du vil få en besked når den er igangsat.',
    accepted: 'Hey det er JOE. Din ordre er igangsat, du vil få en besked når den er klar.',
    done: 'Hey det er JOE. Din ordre er klar til afhentning.',
    rejected: 'Hey det er JOE. Din ordre er blevet afvist, kontakt os venligst for mere information.',
}
// sends an sms to the customer with the message based on the status
const sendSMS = (customer_phone, status, encryptFlag = true) => {
    client.messages
        .create({
            body: messages[status],
            from: '+12057746145',
            to: encryptFlag ? decryptNum(customer_phone) : customer_phone
        })
}

module.exports = sendSMS;