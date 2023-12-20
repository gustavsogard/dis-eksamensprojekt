require('dotenv').config();

// Twilio-legitimationsoplysninger fra .env
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
// henter Twilio-modulet og opretter en klient
const client = require('twilio')(accountSid, authToken);

const { decryptNum } = require('./crypt');

// Opretter beskeder, der skal sendes til kunden for hver status
const messages = {
    created: 'Hej, det er JOE. Din ordre er blevet modtaget, du vil få en besked, når den er igangsat.',
    accepted: 'Hej, det er JOE. Din ordre er igangsat, du vil få en besked, når den er klar.',
    done: 'Hej, det er JOE. Din ordre er klar til afhentning.',
    rejected: 'Hej, det er JOE. Din ordre er blevet afvist, kontakt os venligst for mere information.',
}
// Sender en sms til kunden med beskeden baseret på status
const sendSMS = (customer_phone, status, encryptFlag = true) => {
    client.messages
        .create({
            body: messages[status],
            from: '+12057746145',
            to: encryptFlag ? decryptNum(customer_phone) : customer_phone
        })
}

module.exports = sendSMS;