// Third party imports
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');
const needle = require('needle');

// Type imports
const { TweetBuffer } = require('./tweet-buffer');

// Twitter stuff
const rulesUrl = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamUrl = 'https://api.twitter.com/2/tweets/search/stream';
const { BEARER_TOKEN } = require('../../config.json');

let buff = TweetBuffer(15); // Will hold 15 tweets at a time
let stop = false;

async function startStreamOnServer() {
    // Delete all rules on server start and connect to stream
    let rules = await getAllRules();
    await deleteAllRules(rules);
    streamConnect(0);
}

async function getAllRules() {

    const response = await needle('get', rulesUrl, {
        headers: {
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return (response.body);
}

async function deleteAllRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesUrl, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}


async function setRules(rules) {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesUrl, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 201) {
        throw new Error(JSON.stringify(response.body));
    }

    return (response.body);

}

// Connect to a FilteredStream
function streamConnect(retryAttempt) {

    const stream = needle.get(streamUrl, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${BEARER_TOKEN}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            console.log(json);

            // Update buffer
            buff.add(json);

            // A successful connection resets retry count.
            retryAttempt = 0;
        } catch (e) {
            if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                console.log(data.detail)
                process.exit(1)
            } else {
                // Keep alive signal received. Do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limits, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream. 
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt);
            }, 2 ** retryAttempt)
        }
    });
    return stream;

}

const app = express();

// SERVER DATA
const MAX_TWEETS = 10;
const Tweets = TweetBuffer(MAX_TWEETS);


// SERVER SETUP
app.use(cors());
app.use(logger('dev'));

app.use('/api/', bodyParser.urlencoded({ extended: true }));
app.use('/api/', bodyParser.json());

// SERVER API CALLS
app.get('/api/stream/tweets/', (req, res) => {
    res.send(Tweets.getTweets());
    res.end();
}).delete('/api/stream/tweets/', (req, res) => {
    // TODO: Unsubscribe
});

app.put('/api/stream/', async function (req, res) {
    let rules = req.body.rules;

    console.log(`[/api/stream/PUT]: Received rules:\n${JSON.stringify(req.body)}`);

    // If no rules, error
    if (!rules) {
        console.log('[/api/stream/PUT]: No rules received');
        res.sendStatus(400); // TODO: Add body to response (malformed request)
        res.end();
        return;
    }

    if (rules.length == 0) {
        console.log('[/api/stream/PUT]: No rules received');
        res.sendStatus(400); // TODO: Add body to response (malformed request)
        res.end();
        return;
    }

    try {
        // Prepare new rule set for stream
        console.log(`[/api/stream/PUT]: Resetting stream rules`);
        let oldRules = await getAllRules();
        await deleteAllRules(oldRules);
        await setRules(rules);

        res.sendStatus(200);
        res.end();

    } catch (err) {
        console.log(err);
        res.sendStatus(503);
        res.end();
    }

}).delete('/api/stream/', async function (req, res) {

    // Delete rules from stream to stop incoming
    let rules = await getAllRules();
    await deleteAllRules(rules);
    res.sendStatus(200);
    res.end();
});



startStreamOnServer();
app.listen(3000);