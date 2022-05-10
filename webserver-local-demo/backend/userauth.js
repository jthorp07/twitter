const {getAllRules} = require('./twitter-funcs.js');

module.exports = {


    /**
     * Authenticates a user login by making a quick request
     * and checking its response.
     * 
     * @param {string} bearer_token 
     * @returns {Promise<boolean>}
     */
    async authenticateUser(bearer_token) {

        return new Promise((resolve) => {

            getAllRules(bearer_token).then(rules => {

                // Authenticated
                resolve(true);
                return;

            }).catch(err => {

                // Not authenticated
                resolve(false);
                return;

            });

        });

    }


}