'use strict';

var Calendar = require('dw/util/Calendar');
var Customer = require('dw/customer/Customer');
var StringUtils = require('dw/util/StringUtils');
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
    // @todo validate by boolean and customerid number and not only by boolean one.
    // @todo consider near real time sign up and not real time, but implementation is only 2 state and doesn't have 3rd signing up
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
 * @example member details API response can be found under:
 * src/sfcc/cartridges/int_b2cloyalty/cartridge/scripts/services/mocks/loyalty.memberDetails.json
 * @param {Object} profile - current customer profile
 * @param {Object} loyaltyModel - current loyalty model
 */
function populateMemberDetails(profile, loyaltyModel) {
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

        // we assume only one currency in the program
        loyaltyModel.LoyaltyMemberCurrency = {
            "Name": loyaltyMemberCurrencies[0].Name,
            "PointsBalance": loyaltyMemberCurrencies[0].PointsBalance,
            "TotalPointsAccrued": loyaltyMemberCurrencies[0].TotalPointsAccrued,
        }

        // @TODO after MVP scope to support multiple currencies, refactor will introduce array of objects
        // loyaltyModel.LoyaltyMemberCurrency = [];
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

        // get active benefits from composite API response
        var LoyaltyMemberBenefits = compositeResponse[4].body.records;
        // simple array push of benefits values
        // @TODO for more complex benefits entities consider having array of objects, instead of array of strings.
        loyaltyModel.LoyaltyMemberBenefits = [];

        for (var i = 0; i < LoyaltyMemberBenefits.length; i++) {
            loyaltyModel.LoyaltyMemberBenefits.push(LoyaltyMemberBenefits[i].Name);
        }
    }
}

/**
 * @function
 * @name populateTransactionJournal
 * @example transaction journal API response can be found under:
 * src/sfcc/cartridges/int_b2cloyalty/cartridge/scripts/services/mocks/loyalty.transactionJournal.json
 * @param {Object} profile - current customer profile
 * @param {Object} loyaltyModel - current loyalty model
 */
function populateTransactionJournal(profile, loyaltyModel) {
    var transactionJournalRequest = new (require('*/cartridge/scripts/models/core/transactionJournalRequest'))(profile);
    var requestBody = transactionJournalRequest.getRequestBody();

    var result = ServiceMgr.callRestService('loyalty', 'composite', requestBody);
    if (result.status !== 'OK' || result.object.httpStatusCode === 400) {
        LOGGER.error('Error when retrieving the loyalty transaction journal for request body: {0}', requestBody);
    }
    if (result && result.status === 'OK') {
        var compositeResponse = result.object.compositeResponse;
        loyaltyModel.TransactionJournal = [];

        // @TODO refactor logic by decompose complexity into generic functions, introduce help functions, reduce non-essential variables
        // @TODO confirm with engineering type of activities and reduce false positive business logic inside code
        for ( var i = 0; i < compositeResponse[0].body.totalSize; i++) {
            var isError = false;
            // tj in the bellow loop stands for Transactional Journal
            var tj = compositeResponse[0].body.records[i];
            // get activity date and format it into MM/DD/YYYY
            var tjDate = StringUtils.formatCalendar(new Calendar(new Date(tj.ActivityDate)), 'MM/dd/yyyy');
            // get transaction type and details name
            var tjName = tj.JournalSubType.Name;
            var tjType = tj.JournalType.Name;
            switch (tjType) {
                case 'Accrual':
                    tjType = tjType.toLowerCase();
                    break;
                case 'Redemption':
                    tjType = tjType.toLowerCase();
                    break;
                default:
                    tjType = null;
                    isError = true;
                    LOGGER.error('Error when validating type of the activity for tj: {0}. Expecting either "Accrual" or "Redemption", while {1} was retrieved', tj.Id, tjType);
                    break;
            }

            // validate if record is a platform order and get oder ID if it is
            var tjOrderID = '';
            var isCommerceCloudOrder = tj.Order ? !!tj.Order.SFCC_Order_Number__c : false;

            if (isCommerceCloudOrder) {
                tjOrderID = tj.Order.SFCC_Order_Number__c;
            }

            // calculate rewards
            var tjLedger, tjlRecord;
            var tjRewardPoints = 0;
            var tjTierPoints = 0;

            // calculate total reward points
            if (!isError) {
                // loop over all ledger records and calculate total tier points, considering "credit" and "debit" scenarios
                tjLedger = tj.TransactionJournalLedger;
                for ( var a = 0; a < tjLedger.totalSize; a++) {
                    // tjl stands for Transactional Journal Ledger
                    tjlRecord = tjLedger.records[a];
                    // take into consideration only "Reward Points" program currency
                    // solution in general expect only "Tier Points" or "Reward Points"
                    // we are not logging errors if other program currencies received in the response,
                    // as we don't take them into account in the solution business logic
                    if (tjlRecord.LoyaltyProgramCurrency.Name === 'Reward Points') {
                        if (tjlRecord.EventType === 'Credit') {
                            tjRewardPoints = tjRewardPoints + tjlRecord.Points;
                        } else if (tjlRecord.EventType === 'Debit') {
                            tjRewardPoints = tjRewardPoints - tjlRecord.Points;
                        } else {
                            isError = true;
                            LOGGER.error('Error when validating type of the ledger for tj: {0}. Expecting either "Credit" or "Debit", while {1} was retrieved', tj.Id, tjlRecord.EventType);
                        }
                    }
                }
            }

            // calculate total tier points
            if (!isError) {
                if (tjType === 'redemption') {
                    // in the accrual scenarios no tier points can be granted
                    // hence per UI/UX design we generate non-applicable data value.
                    tjTierPoints = '-';
                } else {
                    // loop over all ledger records and calculate total tier points, considering "credit" and "debit" scenarios
                    tjLedger = tj.TransactionJournalLedger;
                    for ( var b = 0; b < tjLedger.totalSize; b++) {
                        // tjl stands for Transactional Journal Ledger
                        tjlRecord = tjLedger.records[b];
                        // take into consideration only "Tier Points" program currency
                        // solution in general expect only "Tier Points" or "Reward Points"
                        // we are not logging errors if other program currencies received in the response,
                        // as we don't take them into account in the solution business logic
                        if (tjlRecord.LoyaltyProgramCurrency.Name === 'Tier Points') {
                            if (tjlRecord.EventType === 'Credit') {
                                tjTierPoints = tjTierPoints + tjlRecord.Points;
                            } else if (tjlRecord.EventType === 'Debit') {
                                tjTierPoints = tjTierPoints - tjlRecord.Points;
                            } else {
                                isError = true;
                                LOGGER.error('Error when validating type of the ledger for tj: {0}. Expecting either "Credit" or "Debit", while {1} was retrieved', tj.Id, tjlRecord.EventType);
                            }
                        }
                    }
                }
            }

            // write only valid tj records
            if (!isError) {
                loyaltyModel.TransactionJournal.push({
                    "tjId" : tj.Id,
                    "date" : tjDate,
                    "type" : tjType,
                    "name" : tjName,
                    "isOrder" : isCommerceCloudOrder,
                    "orderId" : tjOrderID,
                    "rewardPoints" : tjRewardPoints,
                    "tierPoints" : tjTierPoints
                })
                LOGGER.debug('{0}',JSON.stringify(loyaltyModel.TransactionJournal));
            } else {
                LOGGER.warning('Skipped following transaction journal record: {0}, due to process issues', tj.Id);
            }
        }
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
            case 'transactionJournal':
                populateTransactionJournal(profile, loyaltyModel);
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
