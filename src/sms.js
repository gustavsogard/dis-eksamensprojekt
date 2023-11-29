// indsæt dine egne API nøgler fra twilio.com/console
const accountSid = 'AC07288c15286750785a1fae5d9e181853';
const authToken = '6e1c170c81453a4ccb1d38fd80edf716';
const client = require('twilio')(accountSid, authToken);

// https://www.twilio.com/docs/sms/api/message-resource
smsCreated = (phoneNum) => {
    client.messages
    .create({
        body: 'Hey det er JOE. Din ordre er blevet modtaget, du vil få en besked når den er igangsat.',
        // messagingServiceSid: 'MG2ca7006f9f31e8cxxxxxxxxxxxxxxxxxxxxxx',
        to: phoneNum
    })
    .then(message => console.log(message))
}

smsInProgress = (phoneNum) => {
    client.messages
    .create({
        body: 'Hey det er JOE. Din ordre er igangsat, du vil få en besked når den er klar.',
        // messagingServiceSid: 'MG2ca7006f9f31e8cxxxxxxxxxxxxxxxxxxxxxx',
        to: phoneNum
    })
    .then(message => console.log(message))
}

smsFinished = (phoneNum) => {
    client.messages
    .create({
        body: 'Hey det er JOE. Din ordre er klar til afhentning.',
        // messagingServiceSid: 'MG2ca7006f9f31e8cxxxxxxxxxxxxxxxxxxxxxx',
        to: 'Indsæt nummer fra db.'
    })
    .then(message => console.log(message))
}