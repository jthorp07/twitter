/**
 * This module serves a data structure that makes managing rules look
 * cleaner on the frontend script for the Twitter Streamer demo site. 
 */

/**
 * A JSON representation of a rule the Twitter API
 * would accept for a FilteredStream. This object should
 * be able to be sent directly to Twitter as a rule
 * (assuming the rule is valid).
 * 
 * @typedef {Object} TwitterRule
 * @property {string} value A string containing all rule operators
 * @property {string} tag A string used to identify this rule as a match to a returned Tweet
 * 
 * @param {string} rule
 * @param {string} tag
 * @returns {TwitterRule}
 */
function TwitterRule(rule, tag) {
    return {
        'value': rule,
        'tag': tag
    }
}

/**
 * Used to dynamically construct a rule for a FilteredStream from
 * Twitter's API v2. Stores the rule's flags and conducts checks 
 * the current rule against the restraints placed on different levels
 * of Twitter Developer Accounts to generate warnings when rules
 * potentially start to violate restraints.
 * 
 */
class TwitterRuleManager {
    constructor() {

        this.keywords = '';
        /** @type {string[]} */
        this.flags = [];
        this.tag = '';

        // Vars to check rules against Twitter Developer Account restrictions
        this.maxRuleLength = [512, 512, 1024];

    }
    /**
     * Returns the data in this manager as an object formatted for
     * Twitter's API
     * 
     * @returns {TwitterRule} Object containing this manager's data that can be sent to Twitter's API
     */
    getRule() {
        let rule = this.keywords;
        this.flags.forEach(flag => {
            rule = rule.concat(` ${flag}`);
        });
        return TwitterRule(rule, this.tag);
    }
    /**
     * Adds the flag to this manager's list of flags
     * 
     * @param {string} flag 
     */
    addFlag(flag) {
        this.flags.push(flag);
    }
    /**
     * Removes this flag from the manager's list of flags, if it exists
     * 
     * @param {string} flagToRemove 
     */
    removeFlag(flagToRemove) {
        this.flags.forEach((flag, i) => {
            if (flag.includes(flagToRemove)) {
                this.flags.splice(i, 1);
            }
        });
    }
    /**
     * Returns the character length of the manager's rule
     * 
     * @returns {number}
     */
    getRuleLength() {
        let rule = this.keywords;
        this.flags.forEach(flag => {
            rule = rule.concat(` ${flag}`);
        });
        return rule.length;
    }

    
    /**
     * @returns {string}
     */
    checkCurrentRuleLength() {

        // Check lowest level
        let ruleLength = this.currentRule.getRuleLength();
        if (ruleLength > this.maxRuleLength[0]) {

            // Check next level
            if (ruleLength > this.maxRuleLength[1]) {

                // Check highest level
                if (ruleLength > this.maxRuleLength[2]) {

                    // Highest level warning (if this triggers, rule WILL NOT WORK)
    
                }

                // Medium level warning


            }

            // Lowest level warning

        }

    }
}
export default TwitterRuleManager