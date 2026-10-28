import { MessagesApi, MediaApi, Configuration } from 'bandwidth-sdk';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_CLIENT_ID = process.env.BW_CLIENT_ID;
const BW_CLIENT_SECRET = process.env.BW_CLIENT_SECRET;
const BW_MESSAGING_APPLICATION_ID = process.env.BW_MESSAGING_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const LOCAL_PORT = process.env.LOCAL_PORT;

if([
    BW_ACCOUNT_ID,
    BW_CLIENT_ID,
    BW_CLIENT_SECRET,
    BW_MESSAGING_APPLICATION_ID,
    BW_NUMBER,
    LOCAL_PORT
].some(item => item === undefined) || !Number.isInteger(Number(LOCAL_PORT))) {
    throw new Error('Please set the environment variables defined in the README');
}

const config = new Configuration({
    clientId: BW_CLIENT_ID,
    clientSecret: BW_CLIENT_SECRET
});

const STATUS_MESSAGES = {
    'message-sending': 'message-sending type is only for MMS.',
    'message-delivered': "Your message has been handed off to the Bandwidth's MMSC network, but has not been confirmed at the downstream carrier.",
    'message-failed': 'For MMS and Group Messages, you will only receive this callback if you have enabled delivery receipts on MMS.'
};

const app = express();
app.use(express.json());

const isCallbackList = (body) => Array.isArray(body) && body.every(callback => typeof callback === 'object' && callback !== null);

const saveMedia = async (mediaUrl) => {
    const mediaId = mediaUrl.substring(mediaUrl.indexOf('media/') + 'media/'.length);
    const mediaName = path.basename(mediaId);
    if (mediaName.endsWith('.xml')) {
        return;
    }

    try {
        const mediaApi = new MediaApi(config);
        const { data } = await mediaApi.getMedia(BW_ACCOUNT_ID, mediaId, { responseType: 'arraybuffer' });
        await fs.mkdir('media', { recursive: true });
        await fs.writeFile(path.join('media', mediaName), Buffer.from(data));
        console.log(`Saved media to media/${mediaName}`);
    } catch (err) {
        console.error(`Failed to download ${mediaUrl}:`, err.message);
    }
};

app.post('/messages', async (req, res) => {
    const { to, text, media = [] } = req.body ?? {};
    if (typeof to !== 'string' || typeof text !== 'string'
        || !Array.isArray(media) || !media.every(url => typeof url === 'string')) {
        return res.sendStatus(400);
    }

    const body = {
        applicationId: BW_MESSAGING_APPLICATION_ID,
        to: [to],
        from: BW_NUMBER,
        text: text,
        ...(media.length > 0 && { media })
    };

    try {
        const messagesApi = new MessagesApi(config);
        const { data } = await messagesApi.createMessage(BW_ACCOUNT_ID, body);
        console.log(`Sent message ${data.id}`);
    } catch (err) {
        console.error('Failed to send message:', err.message);
        return res.sendStatus(500);
    }

    res.sendStatus(204);
});

app.post('/callbacks/outbound/messaging/status', async (req, res) => {
    const callbacks = req.body;
    if (!isCallbackList(callbacks) || !callbacks.every(callback => Object.hasOwn(STATUS_MESSAGES, callback.type))) {
        return res.sendStatus(400);
    }

    callbacks.forEach(callback => console.log(STATUS_MESSAGES[callback.type]));
    res.sendStatus(204);
});

app.post('/callbacks/inbound/messaging', async (req, res) => {
    const callbacks = req.body;
    if (!isCallbackList(callbacks) || !callbacks.every(callback => callback.type === 'message-received')) {
        return res.sendStatus(400);
    }

    for (const callback of callbacks) {
        const message = callback.message;
        console.log(`${callback.description}\nTo: ${message.to[0]}\nFrom: ${message.from}\nText: ${message.text}`);
        for (const mediaUrl of message.media ?? []) {
            await saveMedia(mediaUrl);
        }
    }
    res.sendStatus(204);
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.sendStatus(400);
    }
    next(err);
});

app.listen(LOCAL_PORT);
