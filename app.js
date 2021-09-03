import pkg_bw from '@bandwidth/messaging';
import express from 'express';

const { Client, ApiController } = pkg_bw;
const app = express();
app.use(express.json());



const accountId = process.env.BW_ACCOUNT_ID;
const applicationId = process.env.BW_MESSAGING_APPLICATION_ID;
const bwPhoneNumber = process.env.BW_NUMBER;
const port = process.env.LOCAL_PORT;
const username = process.env.BW_USERNAME;
const password = process.env.BW_PASSWORD;

if (!accountId || !applicationId || !bwPhoneNumber) {
    throw new Error(`Enviroment variables not set up properly
    accountId: ${accountId}
    applicationId: ${applicationId}
    phone number: ${bwPhoneNumber}
    port: ${port}`);
}

if (!username){
    throw new Error(`Username: undefined`);
}

if (!password){
    throw new Error(`Password: undefined`);
}

console.log(`Enviroment variables set to:
accountId: ${accountId}
applicationId: ${applicationId}
phone number: ${bwPhoneNumber}
port: ${port}`);

// initialize the client 
const client = new Client({
    basicAuthPassword: password,
    basicAuthUserName: username,
});

// The controller is the main API to the SDK
const controller = new ApiController(client);

app.post('/messages', async (req, res) => {

    const to = req.body.to;
    const text = req.body.text;

    try {
        const response = await controller.createMessage(accountId, {
            applicationId,
            from: bwPhoneNumber,
            to: [to],
            text
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            error: e.message
        });
        return
    }
    res.status(200).json({
        success: true
    });
});

app.post('/callbacks/messageCallback', async (req, res) => {
    const callback = req.body[0];
    res.sendStatus(200);

    switch (callback.type) {
        case 'message-received':
            console.log(`from: ${callback.message.from}, to ${callback.message.to}`);
            console.log(`${callback.message.text}`);
            break;
        case 'message-sending':
            console.log(`message-sending type is only for MMS`);
            break;
        case 'message-delivered':
            console.log(`your message has been handed off to the Bandwidth's MMSC network, but has not been confirmed at the downstream carrier`);
            break;
        case 'message-failed':
            console.log(`For MMS and Group Messages, you will only receive this callback if you have enabled delivery receipts on MMS. `);
            break;
        default:
            break;
    }
})



app.listen(port);