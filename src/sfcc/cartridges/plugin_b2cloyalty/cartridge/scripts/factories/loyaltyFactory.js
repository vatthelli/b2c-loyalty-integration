'use strict';

var Customer = require('dw/customer/Customer');
var Money = require('dw/value/Money');
var collections = require('*/cartridge/scripts/util/collections');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
var CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');

/**
 * @type {dw/system/Log}
 */
var LOGGER = require('dw/system/Logger').getLogger('b2cloyalty', 'scripts.factories.loyaltyFactory');

function populateBaseLoyaltyAttributes(profile, loyaltyModel) {
    var BasketMgr = require('dw/order/BasketMgr');
    loyaltyModel.isLoyaltyCustomer = customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus;
    loyaltyModel.loyaltyCustomerID = customer instanceof Customer ? customer.profile.custom.b2cloyalty_loyaltyProgramMemberId : customer.raw.profile.custom.b2cloyalty_loyaltyProgramMemberId;
}

function populatePointsBalance(profile, loyaltyModel) {
    var pointsBalanceAction = new (require('*/cartridge/scripts/models/core/pointsBalanceAction'))(profile);
    var requestBody = pointsBalanceAction.getRequestBody();
    LOGGER.info('Checking available loyalty points. Here is the request body: {0}', requestBody);
    var result = ServiceMgr.callRestService('loyalty', 'getPointsBalance', requestBody);
    if (result.status != 'OK') {
        LOGGER.error('Error when retrieving the loyalty points for request body: {0}', requestBody);
    }
    if (result && result.status == 'OK') {
        loyaltyModel.allowedPointsAmount = result.object[0].outputValues.PointsBalance;
    }
}

/**
 * Build up a loyalty view model depending on the incoming parameters.
 * @param {*} params Array of possible population alternatives.
 * @returns A populated loyalty model
 */
function get(params) {
    var loyaltyModel = {};
    var profile = customer.profile;
    if (!profile) {
        // Not a registered customer
        return loyaltyModel;
    }
    var parts = params.parts;
    for (var i = 0; i < parts.length; i++) {
        switch (parts[i]) {
            case 'base':
                populateBaseLoyaltyAttributes(profile, loyaltyModel);
                break;
            case 'pointsBalance':
                populatePointsBalance(profile, loyaltyModel);
                break;
            default:
                break;
        }
    }
    return loyaltyModel;
}

module.exports = {
    get: get
};
