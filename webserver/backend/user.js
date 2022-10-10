const { TweetBuffer } = require("./tweet-buffer");
const { streamConnect } = require('./twitter-funcs');
const EventEmitter = require('events');

class User {

    /**
     * 
     * @param {number} maxTweets
     * @param {string} token
     * @param {EventEmitter} killEmitter 
     */
    constructor(maxTweets, token, killEmitter) {

        // Init Fields
        this.tweets = new TweetBuffer(maxTweets);
        this.stream = undefined;
        this.retryAttempt = 0;
        this.token = token;
        this.subscribed = false;
        this.fiveSec = true;
        this.newData = false;
        this.keepAlive = true;
        this.kill = false;

        // Connect Stream
        streamConnect(token).then(stream => {

            // Set as user stream
            this.stream = stream;

            // Set stream callbacks
            stream.on('data', data => {

                try {
                    const json = JSON.parse(data);

                    // Update buffer
                    this.tweets.add(json);

                    // A successful connection resets retry count.
                    this.retryAttempt = 0;
                } catch (e) {
                    if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                        console.log(data.detail);
                        this.kill = true;
                        killEmitter.emit('kill', this.token);
                        return;
                    } else {
                        // Keep alive signal received. Do nothing.
                    }
                }
            }).on('err', async (error) => {
                if (error.code !== 'ECONNRESET') {
                    console.log(error.code);
                    killEmitter.emit('kill', this.token);
                    return;
                } else {
                    // Reconnect logic 
                    setTimeout(() => {
                        console.warn("A connection error occurred. Reconnecting...")
                        
                        // TODO: Implement

                    }, 2 ** this.retryAttempt)
                }
            });
        });

    }

}

module.exports = {
    User
}