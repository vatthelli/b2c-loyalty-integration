'use strict';

let collections = require('*/cartridge/scripts/util/collections');

let PaymentInstrument = require('dw/order/PaymentInstrument');
let PaymentMgr = require('dw/order/PaymentMgr');
let PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
let Resource = require('dw/web/Resource');
let Transaction = require('dw/system/Transaction');
let Money = require('dw/value/Money');
let Status = require('dw/system/Status');
let ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
let CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');

/**
 * @type {dw/system/Log}
 */
let LOGGER = require('dw/system/Logger').getLogger('b2cloyalty', 'scripts.hooks.payment.loyalty');

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
    let currentBasket = basket;
    let serverErrors = [];
    let result = null;
    if (!customer.profile) {
        serverErrors.push('Customer not logged in. Cannot use points!');
    } else {
        let pointsBalanceAction = new (require('*/cartridge/scripts/models/core/pointsBalanceAction'))(customer.profile);
        let requestBody = pointsBalanceAction.getRequestBody();

        LOGGER.info('Checking available loyalty points. Here is the request body: {0}', requestBody);
        result = ServiceMgr.callRestService('loyalty', 'getPointsBalance', requestBody);
        if (result.status != 'OK') {
            serverErrors.push('Something blew up!');
        }
    }

    if (result && result.status == 'OK') {
        let amount = paymentInformation.amount.value;
        let allowedAmount = result.object.outputValues.pointsBalance;
        if (amount > allowedAmount) {
            serverErrors.push('Not enough points. Expected: ' + amount + ', allowed: ' + allowedAmount);
        } else {
            Transaction.wrap(function () {
                let paymentInstruments = currentBasket.getPaymentInstruments(
                    CONSTANTS.LOYALTY_PAYMENT_METHOD_ID
                );
                collections.forEach(paymentInstruments, function (item) {
                    currentBasket.removePaymentInstrument(item);
                });
                let moneyAmount = Money(amount, currentBasket.getCurrencyCode());

                let paymentInstrument = currentBasket.createPaymentInstrument(CONSTANTS.LOYALTY_PAYMENT_METHOD_ID, moneyAmount);
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
exports.createToken = createToken;
