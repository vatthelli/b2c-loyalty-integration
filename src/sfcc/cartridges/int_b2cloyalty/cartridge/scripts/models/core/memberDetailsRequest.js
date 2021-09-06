'use strict';

/**
 * @object {Class}
 * @typedef MemberDetailsRequest This class is used to build requests for a composite API which will fetch Tier,
 * Point Balance, and other details of a Loyalty Program Member
 * @property {Function} getRequestBody Builds up the request body for the Composite API operation
 *
 * @constructor
 * @param {dw/customer/Customer} [profile] Profile Represents the B2C Commerce customer profile
 */
function MemberDetailsRequest(profile) {

    /** @type {dw/customer/Profile} */
    this.profile = profile;

    // Exit early if no provide is provided
    if (!this.profile) { return; }

    /**
     * @typedef {Object} memberDetailsRequest Represents the request
     * @property {String} ContactId ContactId ID in CRM
     */
    /** @type {MemberDetailsRequest} */
    this.requestObject = {
        "compositeRequest": [
            {
                "method": "GET",
                "url": "/services/data/v52.0/query?q=select+Id,+MembershipNumber+from+LoyaltyProgramMember+where+Id='"+this.profile.custom.b2cloyalty_loyaltyProgramMemberId+"'",
                "referenceId": "refLoyaltyProgramMember"
            },
            {
                "method": "GET",
                "url": "/services/data/v52.0/query?q=SELECT+Name,+PointsBalance,+TotalPointsAccrued+FROM+LoyaltyMemberCurrency+WHERE+LoyaltyMemberId='@{refLoyaltyProgramMember.records[0].Id}'",
                "referenceId": "refMemberCurrency"
            },
            {
                "method": "GET",
                "url": "/services/data/v52.0/query?q=SELECT+Name,+LoyaltyTierGroupId+FROM+LoyaltyMemberTier+WHERE+LoyaltyMemberId='@{refLoyaltyProgramMember.records[0].Id}'",
                "referenceId": "refMemberTier"
            },
            {
                "method": "GET",
                "url": "/services/data/v52.0/query?q=SELECT+Name+FROM+LoyaltyTierGroup+WHERE+iD='@{refMemberTier.records[0].LoyaltyTierGroupId}'",
                "referenceId": "refMemberTierGroup"
            },
            {
                "method": "GET",
                "url": "/services/data/v52.0/query?q=SELECT+Name+FROM+MemberBenefit+WHERE+MemberId='@{refLoyaltyProgramMember.records[0].Id}'+AND+Status<>'Expired'",
                "referenceId": "refBenefit"
            }
        ]
    }
}

MemberDetailsRequest.prototype = {
    /**
     * @memberOf MemberDetailsRequest
     * @function getRequestBody
     * @description Builds up the request body for the Composite API operation
     *
     * @returns {String} Returns the body to be used by the serviceRequest
     */
    getRequestBody: function () {
        return JSON.stringify(this.requestObject);
    },
};

module.exports = MemberDetailsRequest;
