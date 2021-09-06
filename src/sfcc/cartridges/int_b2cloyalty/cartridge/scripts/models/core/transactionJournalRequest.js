'use strict';

/**
 * @object {Class}
 * @typedef TransactionJournalRequest This class is used to build requests for a composite API which will fetch Tier,
 * Point Balance, and other details of a Loyalty Program Member
 * @property {Function} getRequestBody Builds up the request body for the Composite API operation
 *
 * @constructor
 * @param {dw/customer/Customer} [profile] Profile Represents the B2C Commerce customer profile
 */
function TransactionJournalRequest(profile) {

    /** @type {dw/customer/Profile} */
    this.profile = profile;

    // Exit early if no provide is provided
    if (!this.profile) {
        return;
    }

    /**
     * @typedef {Object} transactionJournalRequest Represents the request
     * @property {String} ContactId ContactId ID in CRM
     */
    /** @type {TransactionJournalRequest} */
    this.requestObject = {
        "compositeRequest": [
            {
                "method": "GET",
                "url": "/services/data/v52.0/query?q=SELECT+Id,+ActivityDate,+JournalType.Name,+JournalSubType.Name,+Order.SFCC_Order_Number__c,+Redeem_Points__c,+(SELECT+LoyaltyProgramCurrency.Name,+Points,+EventType+FROM+TransactionJournalLedger)+FROM+TransactionJournal+WHERE+MemberId='" + this.profile.custom.b2cloyalty_loyaltyProgramMemberId + "'+ORDER+BY+ActivityDate+DESC",
                "referenceId": "refTransactionJournal"
            }
        ]
    }
}

TransactionJournalRequest.prototype = {
    /**
     * @memberOf TransactionJournalRequest
     * @function getRequestBody
     * @description Builds up the request body for the Composite API operation
     *
     * @returns {String} Returns the body to be used by the serviceRequest
     */
    getRequestBody: function () {
        return JSON.stringify(this.requestObject);
    },
};

module.exports = TransactionJournalRequest;
