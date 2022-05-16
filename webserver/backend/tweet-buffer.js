class TweetBuffer {


    /**
     * A simple queue-like data structure to manage
     * Tweet data on the server.
     * 
     * This will store no more than maxSize tweets to prevent the server
     * from taking too much memory and to avoid writing to a file on the
     * device's hard drive
     * 
     * @param {number} maxSize Maximum number of Tweets that can be stored
     */
    constructor(maxSize) {

        /** @type {Tweet[]} */
        this.buffer = [];
        this.maxSize = maxSize;

    }


    add(tweet) {
        this.buffer.push(tweet);
        // If over capacity, remove first (oldest) element
        if (this.buffer.length > maxSize) {
            this.buffer.splice(0, 1);
        }
    }

    getTweets() {
        return this.buffer;
    }

}



/**
 * @typedef {Object} MatchingRuleData
 * @property {string} id
 * @property {string} tag
 */


class Tweet {

    /**
     * 
     * @param {string} id 
     * @param {string} text 
     * @param {MatchingRuleData[]} matches 
     */
    constructor(id, text, matches) {

        this.data = {
            id: id,
            text: text
        }

        this.matching_rules = matches;

    }
}

module.exports = {
    TweetBuffer,
    Tweet
}