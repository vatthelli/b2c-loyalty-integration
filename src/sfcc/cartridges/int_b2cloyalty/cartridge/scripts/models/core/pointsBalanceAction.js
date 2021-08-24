'use strict';

var Site = require('dw/system/Site');

/**
 * @object {Class}
 * @typedef PointsBalanceAction This class is used to build requests for getPointsBalance REST API
 * @property {Function} getRequestBody Builds up the request body for the REST API operation
 *
 * @constructor
 * @param {dw/customer/Customer} [profile] Profile Represents the B2C Commerce customer profile
 */
function PointsBalanceAction(profile) {

    /** @type {dw/customer/Profile} */
    this.profile = profile;

    // Exit early if no provide is provided
    if (!this.profile) { return; }

    /**
     * @typedef {Object} pointsBalanceAction Represents the request
     * @property {String} LoyaltyProgramMemberId Member ID in Loyalty system
     * @property {String} ProgramCurrencyName Loyalty currency name
     * @property {String} ProgramName Loyalty program name
     */
    /** @type {pointsBalanceAction} */
    this.requestObject = {
        LoyaltyProgramMemberId: this.profile.custom.b2cloyalty_loyaltyProgramMemberId,
        ProgramCurrencyName: Site.getCurrent().getCustomPreferenceValue('b2cloyalty_programCurrencyName'),
        ProgramName: Site.getCurrent().getCustomPreferenceValue('b2cloyalty_programName')
    };
}

PointsBalanceAction.prototype = {
    /**
     * @memberOf PointsBalanceAction
     * @function getRequestBody
     * @description Builds up the request body for the REST API operation
     *
     * @returns {String} Returns the body to be used by the serviceRequest
     */
    getRequestBody: function () {
        return JSON.stringify({
            inputs: [this.requestObject]
        });
    },
};

module.exports = PointsBalanceAction;
