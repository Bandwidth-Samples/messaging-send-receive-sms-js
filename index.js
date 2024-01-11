import { MessagesApi, Configuration } from 'bandwidth-sdk';
import express from 'express';

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_MESSAGING_APPLICATION_ID = process.env.BW_MESSAGING_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const LOCAL_PORT = process.env.LOCAL_PORT;

if([
    BW_ACCOUNT_ID,
    BW_MESSAGING_APPLICATION_ID,
    BW_NUMBER,
    BW_USERNAME,
    BW_PASSWORD,
    LOCAL_PORT
].some(item => item === undefined)) {
    throw new Error('Please set the environment variables defined in the README');
}

const config = new Configuration({
    username: BW_USERNAME,
    password: BW_PASSWORD
});

const app = express();
app.use(express.json());

app.post('/sendMessage', async (req, res) => {
    const body = {
        from: BW_NUMBER,
        applicationId: BW_MESSAGING_APPLICATION_ID,
        ...req.body
    };
    
    const messagesApi = new MessagesApi(config);
    messagesApi.createMessage(BW_ACCOUNT_ID, body);
    res.sendStatus(200);
});

app.post('/callbacks/outbound/messaging/status', async (req, res) => {
    const callback = req.body[0];
    res.sendStatus(200);

    switch (callback.type) {
        case 'message-sending':
            console.log('message-sending type is only for MMS.');
            break;
        case 'message-delivered':
            console.log("Your message has been handed off to the Bandwidth's MMSC network, but has not been confirmed at the downstream carrier.");
            break;
        case 'message-failed':
            console.log('For MMS and Group Messages, you will only receive this callback if you have enabled delivery receipts on MMS.');
            break;
        default:
            console.log('Message type does not match endpoint. This endpoint is used for message status callbacks only.');
            break;
    }
});

app.post('/callbacks/inbound/messaging', async (req, res) => {
    const callback = req.body[0];
    res.sendStatus(200);

    if (callback.type === 'message-received') {
        console.log(`To: ${callback.message.to[0]}`);
        console.log(`From: ${callback.message.from}`);
        console.log(`Text: ${callback.message.text}`);
    } else {
        console.log('Message type does not match endpoint. This endpoint is used for inbound messages only.');
        console.log('Outbound message status callbacks should be sent to /callbacks/outbound/messaging/status.');
    }
});

app.listen(LOCAL_PORT);
