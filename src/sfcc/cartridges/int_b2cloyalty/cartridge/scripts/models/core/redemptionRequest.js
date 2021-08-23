'use strict';

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');

/**
 * @object {Class}
 * @typedef RedemptionRequest This class is used to build requests for getPointsBalance REST API
 * @property {Function} getRequestBody Builds up the request body for the REST API operation
 *
 * @constructor
 * @param {dw/customer/Customer} [profile] Profile Represents the B2C Commerce customer profile
 * @param {String} [transactionId] 
 * @param {dw/value/Money} [amount]
 */
function RedemptionRequest(profile, transactionId, amount) {

    /** @type {dw/customer/Profile} */
    this.profile = profile;
    this.transactionId = transactionId;
    this.amount = amount;

    // Exit early if no provide is provided
    if (!this.profile) { return; }

    /**
     * @typedef {Object} redemptionRequest Represents the request
     * @property {String} LoyaltyProgramMemberId Member ID in Loyalty system
     * @property {String} ProgramCurrencyName Loyalty currency name
     * @property {String} ProgramName Loyalty program name
     */
    /** @type {redemptionRequest} */
    this.requestObject = {
        LoyaltyProgramName: Site.getCurrent().getCustomPreferenceValue('b2cloyalty_programName'),
        MembershipNumber: this.profile.custom.b2cloyalty_loyaltyProgramMemberId,
        ActivityDate: StringUtils.formatCalendar(new Calendar(new Date()), 'yyyy-MM-dd'),
        CurrencyName: Site.getCurrent().getCustomPreferenceValue('b2cloyalty_programCurrencyName'),
        Points: this.amount.value,
        ExternalTransactionNumber: this.transactionId,
    };
}

RedemptionRequest.prototype = {
    /**
     * @memberOf RedemptionRequest
     * @function getRequestBody
     * @description Builds up the request body for the REST API operation
     *
     * @returns {String} Returns the body to be used by the serviceRequest
     */
    getRequestBody: function () {
        return JSON.stringify(this.requestObject);
    },
};

module.exports = RedemptionRequest;
