/**
 * This module is made for demonstration and educational purposes for
 * Dr. Brian Toevs' Cybercrime & Digital Forensics class taught at
 * Rose-Hulman Institute of Technology.
 * 
 * When run with proper credentials, this script will open a stream
 * of public tweats and pull those that meet the rules provided by
 * the script. This version of the script will have no interface and
 * will just log tweet information to the console until the interrupt
 * signal is sent (CTRL + C)
 * 
 * This script contains code modified from the TwitterDev tutorial on
 * making a FilterStream from Twitter's v2 API:
 * https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/main/Filtered-Stream/filtered_stream.js
 * 
 */


// Imports
const { Client } = require('twitter-api-sdk');
const needle = require('needle');
const { BEARER_TOKEN } = require('../config.json');

// Globals for Twitter connection
const rulesUrl = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamUrl = 'https://api.twitter.com/2/tweets/search/stream';

// Hardcoded rules
const rules = [{
    'value': 'dog has:images -is:retweet',
    'tag': 'dog pictures'
},
{
    'value': 'cat has:images -grumpy',
    'tag': 'cat pictures'
},
];

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

async function setRules() {

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
        throw new Error(response.body);
    }

    return (response.body);

}

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


(async () => {
    let currentRules = rules;

    try {
        // Gets the complete list of rules currently applied to the stream
        let oldRules = await getAllRules();


        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteAllRules(oldRules);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules(currentRules);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    // Listen to the stream.
    console.log('Connecting to stream...');
    streamConnect(0);
})();
