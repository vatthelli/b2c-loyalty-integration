'use strict';

var Customer = require('dw/customer/Customer');
var Money = require('dw/value/Money');
var collections = require('*/cartridge/scripts/util/collections');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
var CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');
var pointsToMoneyHelpers = require('*/cartridge/scripts/helpers/pointsToMoneyHelpers');
var moneyModel = require('*/cartridge/models/money');

/**
 * @type {dw/system/Log}
 */
var LOGGER = require('dw/system/Logger').getLogger('b2cloyalty', 'scripts.factories.loyaltyFactory');

function populateBaseLoyaltyAttributes(profile, loyaltyModel) {
    loyaltyModel.isLoyaltyCustomer = customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus;
    // @TODO consider remove bellow if we can use composite APIs and reuse contactID to get memberID
    loyaltyModel.loyaltyCustomerID = customer instanceof Customer ? customer.profile.custom.b2cloyalty_loyaltyProgramMemberId : customer.raw.profile.custom.b2cloyalty_loyaltyProgramMemberId;
}

function populatePointsBalance(profile, loyaltyModel) {
    var BasketMgr = require('dw/order/BasketMgr');
    var pointsBalanceAction = new (require('*/cartridge/scripts/models/core/pointsBalanceAction'))(profile);
    var requestBody = pointsBalanceAction.getRequestBody();
    LOGGER.info('Checking available loyalty points. Here is the request body: {0}', requestBody);
    var result = ServiceMgr.callRestService('loyalty', 'getPointsBalance', requestBody);
    if (result.status != 'OK') {
        LOGGER.error('Error when retrieving the loyalty points for request body: {0}', requestBody);
    }
    if (result && result.status == 'OK') {
        loyaltyModel.allowedPointsAmount = result.object[0].outputValues.PointsBalance;
        
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket.getCurrencyCode()) {
            loyaltyModel.allowedPointsAsMoney = moneyModel.toMoneyModel(pointsToMoneyHelpers.pointsToMoney(loyaltyModel.allowedPointsAmount, currentBasket.getCurrencyCode()));
        } else {
            loyaltyModel.allowedPointsAsMoney = '-';
        }
    }
}

/**
 * @function
 * @name populateMemberDetails
 * @param {Object} profile - current customer profile
 * @param {Object} loyaltyModel - current loyalty model
 */
function populateMemberDetails(profile, loyaltyModel){
    var memberDetailsRequest = new (require('*/cartridge/scripts/models/core/memberDetailsRequest'))(profile);
    var requestBody = memberDetailsRequest.getRequestBody();

    var result = ServiceMgr.callRestService('loyalty', 'composite', requestBody);
    if (result.status !== 'OK') {
        LOGGER.error('Error when retrieving the loyalty member details for request body: {0}', requestBody);
    }
    if (result && result.status === 'OK') {
        var compositeResponse = result.object.compositeResponse;
        // get membership number from composite API response
        loyaltyModel.LoyaltyProgramMember = {
            "MembershipNumber": compositeResponse[0].body.records[0].MembershipNumber
        };

        // get currency with points from composite API response
        var loyaltyMemberCurrencies = compositeResponse[1].body.records;
        loyaltyModel.LoyaltyMemberCurrency = [];

        // we assume only one currency in the program
        loyaltyModel.LoyaltyMemberCurrency = {
            "Name": loyaltyMemberCurrencies[0].Name,
            "PointsBalance": loyaltyMemberCurrencies[0].PointsBalance,
            "TotalPointsAccrued": loyaltyMemberCurrencies[0].TotalPointsAccrued,
        }

        // @TODO after MVP scope to support multiple currencies, refactor will introduce array of objects
        // for(var i = 0; i < loyaltyMemberCurrencies.length; i++) {
        //     loyaltyModel.LoyaltyMemberCurrency[i] = {
        //         "Name": loyaltyMemberCurrencies[i].Name,
        //         "PointsBalance": loyaltyMemberCurrencies[i].PointsBalance,
        //         "TotalPointsAccrued": loyaltyMemberCurrencies[i].TotalPointsAccrued,
        //     }
        // }

        // we assume only one tier assigned to the customer in the program
        // get tier name from composite API response
        loyaltyModel.LoyaltyMemberTier = {
            "Name": compositeResponse[2].body.records[0].Name
        };
        loyaltyModel.LoyaltyMemberTierGroup = {
            "Name": compositeResponse[3].body.records[0].Name
        };
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
            case 'memberDetails':
                populateMemberDetails(profile, loyaltyModel);
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
