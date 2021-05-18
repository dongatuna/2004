const accountSid = TWILIO_ACCOUNT_SID;
const authToken = TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

module.exports = {
    //send to individual person
    sendOneText: async ( studentDetails ) => {
        try {
           
            const message = await client.messages
                                    .create({
                                        body: `${studentDetails.msg}`,
                                        messagingServiceSid: TWILIO_MSG_SID,      
                                        to: `${studentDetails.tel}`     
                                    })
            //.then(message => console.log(message.sid));
            
        } catch (error) {
            console.log(`Twilio error ${error}`)
        }       
    }
}

