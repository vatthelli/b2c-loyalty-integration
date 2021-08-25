'use strict';

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var Status = require('dw/system/Status');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
var CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');
var pointsToMoneyHelpers = require('*/cartridge/scripts/helpers/pointsToMoneyHelpers');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * @type {dw/system/Log}
 */
var LOGGER = require('dw/system/Logger').getLogger('b2cloyalty', 'scripts.hooks.payment.loyalty');

/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
    return Math.random().toString(36).substr(2);
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
    var currentBasket = basket;
    var serverErrors = [];
    var result = null;
    if (!customer.profile) {
        serverErrors.push('Customer not logged in. Cannot use points!');
    } else {
        var pointsBalanceAction = new (require('*/cartridge/scripts/models/core/pointsBalanceAction'))(customer.profile);
        var requestBody = pointsBalanceAction.getRequestBody();

        LOGGER.info('Checking available loyalty points. Here is the request body: {0}', requestBody);
        result = ServiceMgr.callRestService('loyalty', 'getPointsBalance', requestBody);
        if (result.status != 'OK') {
            serverErrors.push('Something blew up!');
        }
    }
    if (result && result.status == 'OK') {
        var pointAmount = paymentInformation.amount.value;
        var allowedPointAmount = result.object.outputValues.pointsBalance;
        if (pointAmount > allowedPointAmount) {
            serverErrors.push('Not enough points. Expected: ' + pointAmount + ', allowed: ' + allowedPointAmount);
        } else {
            var moneyAmount = pointsToMoneyHelpers.pointsToMoney(pointAmount, currentBasket.getCurrencyCode());
            Transaction.wrap(function () {
                var paymentInstruments = currentBasket.getPaymentInstruments(
                    CONSTANTS.LOYALTY_PAYMENT_METHOD_ID
                );
                collections.forEach(paymentInstruments, function (item) {
                    currentBasket.removePaymentInstrument(item);
                });

                var paymentInstrument = currentBasket.createPaymentInstrument(CONSTANTS.LOYALTY_PAYMENT_METHOD_ID, moneyAmount);
                // paymentInstrument.paymentTransaction.custom.status = 'PENDING';
                // paymentInstrument.custom.piStatus = 'PENDING';
            });
        }
    }

    return { fieldErrors: [], serverErrors: serverErrors, error: serverErrors.length > 0 };
}

/**
 * Authorizes a payment using loyalty points.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var result = null;
    var transactionId = orderNumber + createToken();

    if (!customer.profile) {
        serverErrors.push('Customer not logged in. Cannot use points!');
    } else {
        var amount = paymentInstrument.getPaymentTransaction().getAmount();
        var redemptionRequest = new (require('*/cartridge/scripts/models/core/redemptionRequest'))(customer.profile, transactionId, amount);
        var requestBody = redemptionRequest.getRequestBody();

        LOGGER.info('Redeeming loyalty points. Here is the request body: {0}', requestBody);
        result = ServiceMgr.callRestService('loyalty', 'redemption', requestBody);
        if (result.status != 'OK') {
            serverErrors.push('Something blew up when redeeming loyalty ponts!');
        }
    }
    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(transactionId);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
