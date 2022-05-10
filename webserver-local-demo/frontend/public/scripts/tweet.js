

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
class Tweet {

    /**
     * @param {string} id
     * @param {string} text
     * @param {MatchingRuleData[]} matches
     * 
     */
    constructor(id, text, matches) {

        /** @type {TweetData} */
        this.data = {
            id: id,
            text: text
        }

        /** @type {MatchingRuleData[]} */
        this.matching_rules = matches;

    }

}

export default Tweet