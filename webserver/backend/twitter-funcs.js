/**
 * This module takes functions sources from
 * https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/main/Filtered-Stream/filtered_stream.js
 * and modifies them for use by the backend of the demo webserver. Modifications are primarily being
 * made with regard parameters and return behavior so that the webserver can handle multiple users
 * at once.
 */

const needle = require('needle');

const rulesUrl = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamUrl = 'https://api.twitter.com/2/tweets/search/stream';


/**
 * 
 * 
 * @param {string} bearer_token User's API token
 * @returns {Promise<Object>} Existing rules on stream
 */
async function getAllRules(bearer_token) {

    console.log(bearer_token);

    return new Promise(async function (resolve, reject) {
        const response = await needle('get', rulesUrl, {
            headers: {
                "authorization": `Bearer ${bearer_token}`
            }
        });

        if (response.statusCode !== 200) {
            console.log("Error:", response.statusMessage, response.statusCode);
            reject(response.body);
        }

        resolve(response.body);
    });

}

/**
 * 
 * 
 * @param {string} bearer_token User's bearer token
 * @returns {Promise<boolean>} Success or failure
 */
async function deleteAllRules(bearer_token) {

    return new Promise(async function (resolve) {

        let rules = await getAllRules(bearer_token);

        if (!rules.data) {
            resolve(true);
            return;
        }

        if (!Array.isArray(rules.data)) {
            resolve(false);
            return;
        }

        const ids = rules.data.map(rule => rule.id);

        const data = {
            "delete": {
                "ids": ids
            }
        };

        const response = await needle('post', rulesUrl, data, {
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${bearer_token}`
            }
        });

        if (response.statusCode !== 200) {
            console.error(response.body);
            resolve(false);
            return;
        }
        resolve(true);
        return;
    });
}

/**
 * 
 * 
 * @param {Array} rules Rules to be set
 * @param {string} bearer_token User's API token
 * @returns {Promise<boolean>} success or fail
 */
async function setRules(rules, bearer_token) {

    return new Promise(async function (resolve) {
        const data = {
            "add": rules
        }

        const response = await needle('post', rulesUrl, data, {
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${bearer_token}`
            }
        })

        if (response.statusCode !== 201) {
            console.error(JSON.stringify(response.body));
            resolve(false);
            return;
        }

        resolve(true);
        return;
    });
}

/**
 * 
 * 
 * @param {string} bearer_token The user's API token
 * @returns {Promise<NodeJS.ReadableStream>} Created stream and buffer?
 */
function streamConnect(bearer_token) {

    return new Promise(async function (resolve, reject) {

        const stream = needle.get(streamUrl, {
            headers: {
                "User-Agent": "v2FilterStreamJS",
                "Authorization": `Bearer ${bearer_token}`
            },
            timeout: 20000
        });
        resolve(stream);
        return;
    });
}

module.exports = {
    getAllRules,
    deleteAllRules,
    setRules,
    streamConnect
}