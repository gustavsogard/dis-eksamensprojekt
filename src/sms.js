// indsæt dine egne API nøgler fra twilio.com/console
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require('twilio')(accountSid, authToken);
const { decryptNum } = require('./crypt');
const messages = {
    created: 'Hey det er JOE. Din ordre er blevet modtaget, du vil få en besked når den er igangsat.',
    accepted: 'Hey det er JOE. Din ordre er igangsat, du vil få en besked når den er klar.',
    done: 'Hey det er JOE. Din ordre er klar til afhentning.',
}

const sendSMS = (phoneNum, status) => {
    console.log(phoneNum, status);
    console.log(decryptNum(phoneNum));
    client.messages
        .create({
            body: messages[status],
            from: '+12052364320',
            to: decryptNum(phoneNum)
        })
        .then(message => console.log(message))
}

module.exports = sendSMS;