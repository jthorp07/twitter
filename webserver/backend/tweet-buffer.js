module.exports = {

    /**
     * @typedef {Object} TweetData
     * @property {string} id
     * @property {string} text  
     */

    /**
     * @typedef {Object} MatchingRuleData
     * @property {string} id
     * @property {string} tag
     */

    /**
     * @typedef {Object} Tweet
     * @property {TweetData} data
     * @property {MatchingRuleData[]} matching_rules
     */

    /**
     * @param {string} id
     * @param {string} text
     * @param {MatchingRuleData[]} matches
     * 
     * @returns {Tweet}
     */
    Tweet(id, text, matches) {
        return {
            data: {
                id: id,
                text: text
            },
            matching_rules: matches
        }
    },
    
    /**
     * @callback TypeFnAddTweet
     * @param {Tweet} tweet
     * @returns {void}
     */

    /**
     * @callback TypeFnGetTweets  
     * @returns {Tweet[]}
     */

    /**
     * @typedef {Object} TweetBuffer
     * @property {Tweet[]} buffer
     * @property {number} maxSize
     * 
     * @property {TypeFnAddTweet} add
     * @property {TypeFnGetTweets} getTweets
     * 
     */

    /**
     * A simple queue-like data structure to manage
     * Tweet data on the server.
     * 
     * This will store no more than maxSize tweets to prevent the server
     * from taking too much memory and to avoid writing to a file on the
     * device's hard drive
     * 
     * @param {number} maxSize Maximum number of Tweets that can be stored
     * @returns {TweetBuffer}
     */
    TweetBuffer(maxSize) {
        return {
            buffer: [],
            maxSize: maxSize,
            add(tweet) {
                this.buffer.push(tweet);
                // If over capacity, remove first (oldest) element
                if (this.buffer.length > maxSize) {
                    this.buffer.splice(0,1);
                }
            },
            getTweets() {
                return this.buffer;
            }
        }
    }

}