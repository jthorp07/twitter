/**
 * This module takes functions sources from
 * https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/main/Filtered-Stream/filtered_stream.js
 * and modifies them for use by the backend of the demo webserver. Modifications are primarily being
 * made with regard parameters and return behavior so that the webserver can handle multiple users
 * at once.
 */

module.exports = {

    /**
     * 
     * @param {string} bearer_token User's API token
     * @returns {Promise<Object>} Existing rules on stream
     */
    async getAllRules(bearer_token) {

        return new Promise(async function(resolve, reject) {
            const response = await needle('get', rulesUrl, {
                headers: {
                    "authorization": `Bearer ${bearer_token}`
                }
            })

            if (response.statusCode !== 200) {
                console.log("Error:", response.statusMessage, response.statusCode)
                reject(response.body);
            }

            resolve(response.body);
        });

    },

    /**
     * 
     * @param {Object} rules Formatted rule IDs to be deleted
     * @param {string} bearer_token User's bearer token
     * @returns {Promise<boolean>} Success or failure
     */
    async deleteAllRules(rules, bearer_token) {

        return new Promise(async function (resolve) {
            if (!Array.isArray(rules.data)) {
                resolve(false);
                return;
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
                    "authorization": `Bearer ${bearer_token}`
                }
            })

            if (response.statusCode !== 200) {
                console.error(response.body);
                resolve(false);
                return;
            }
            resolve(true);
            return;
        });



    },

    /**
     * 
     * @param {Array} rules Rules to be set
     * @param {string} bearer_token User's API token
     * @returns {Promise<boolean>} success or fail
     */
    async setRules(rules, bearer_token) {

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
    },


    /**
     * 
     * @param {number} retryAttempt The attempt number of this function
     * @param {string} bearer_token The user's API token
     * @returns {Promise<boolean>} Success or failure
     */
    streamConnect(retryAttempt, bearer_token) {

        const stream = needle.get(streamUrl, {
            headers: {
                "User-Agent": "v2FilterStreamJS",
                "Authorization": `Bearer ${bearer_token}`
            },
            timeout: 20000
        });

        stream.on('data', data => {
            try {
                const json = JSON.parse(data);
                // console.log(json);

                // Update buffer
                Tweets.add(json);
                console.log(`[Server]: Tweet Received`);

                // A successful connection resets retry count.
                retryAttempt = 0;
            } catch (e) {
                if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                    console.log(data.detail)

                    // TODO: Kill stream on server

                } else {
                    // Keep alive signal received. Do nothing.
                }
            }
        }).on('err', error => {
            if (error.code !== 'ECONNRESET') {
                console.log(error.code);

                // TODO: Kill stream on server

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

}