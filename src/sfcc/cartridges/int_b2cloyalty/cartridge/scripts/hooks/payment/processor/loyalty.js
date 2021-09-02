'use strict';

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var Status = require('dw/system/Status');
var HashMap = require('dw/util/HashMap');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
var CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');
var pointsToMoneyHelpers = require('*/cartridge/scripts/helpers/pointsToMoneyHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

/**
 * @type {dw/system/Log}
 */
var LOGGER = require('dw/system/Logger').getLogger('b2cloyalty', 'scripts.hooks.payment.loyalty');

/**
 * Verifies that the entered loyalty details are valid. The verification even contacts the external system to check
 * that the number of points is allowed. If the information is valid a loyalty payment instrument is created.
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
    var currentBasket = basket;
    var fieldErrorsObject = {};
    var serverErrors = [];
    var result = null;
    var fieldErrorsMap = new HashMap();
    var fieldErrors = [];
    
    // Remove all previous loyalty payment instruments. Also remove all CC instruments. It may
    // sound unintuitive, but we really want to add credit card instruments last. If we update
    // the loyalty PI, then we have to update the CC PI as well, which means we have to remove
    // it at this point
    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(CONSTANTS.LOYALTY_PAYMENT_METHOD_ID);
        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });
        var ccPaymentInstruments = currentBasket.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        collections.forEach(ccPaymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });
    });

    var pointAmount = paymentInformation.amount.value;

    if (!customer.profile) {
        serverErrors.push(Resource.msg('error.customer.not.logged.in', 'loyaltyPayment', null));
    } else if (pointAmount == null || pointAmount < 0) {
        fieldErrorsMap.put(paymentInformation.amount.htmlName, Resource.msg('error.amount.negativeOrZero', 'loyaltyPayment', null));
    } else if (pointAmount == 0) {
        // 0 points means removing any loyalty and CC transactions but not adding a new one, which is a valid case
        return {fieldErrors: [], serverErrors: [], error: false};
    } else {
        var pointsBalanceAction = new (require('*/cartridge/scripts/models/core/pointsBalanceAction'))(customer.profile);
        var requestBody = pointsBalanceAction.getRequestBody();
        LOGGER.info('Checking available loyalty points. Here is the request body: {0}', requestBody);
        result = ServiceMgr.callRestService('loyalty', 'getPointsBalance', requestBody);
        if (result.status != 'OK') {
            serverErrors.push(Resource.msg('error.integration', 'loyaltyPayment', null));
        }
    }

    if (result && result.status == 'OK') {
        var allowedPointAmount = result.object[0].outputValues.PointsBalance;
        if (!allowedPointAmount || pointAmount > allowedPointAmount) {
            fieldErrorsMap.put(paymentInformation.amount.htmlName, Resource.msgf('error.points.notEnough', 'loyaltyPayment', null, pointAmount, allowedPointAmount));
        } else {
            var moneyAmount = pointsToMoneyHelpers.pointsToMoney(pointAmount, currentBasket.getCurrencyCode());
            var remainingAmount = paymentHelpers.getRemainingAmount(basket);
            var remainingAmountAsPoints = pointsToMoneyHelpers.moneyToPoints(remainingAmount);
            if (pointAmount > remainingAmountAsPoints) {
                fieldErrorsMap.put(paymentInformation.amount.htmlName, Resource.msgf('error.points.tooMany', 'loyaltyPayment', null, pointAmount, remainingAmountAsPoints));
            }
        }
    }

    var error = serverErrors.length > 0 || !fieldErrorsMap.isEmpty();
    if (!error) {
        Transaction.wrap(function () {
            var paymentInstrument = currentBasket.createPaymentInstrument(CONSTANTS.LOYALTY_PAYMENT_METHOD_ID, moneyAmount);
        });
    } else {
        var fieldErrorsIt = fieldErrorsMap.entrySet().iterator();
        var fieldErrorsObj = {};
        while (fieldErrorsIt.hasNext()) {
            var oneEntry = fieldErrorsIt.next();
            fieldErrorsObj[oneEntry.key] = oneEntry.value;
        }
        fieldErrors = [fieldErrorsObj];
    }
    return {fieldErrors: fieldErrors, serverErrors: serverErrors, error: error};
}

/**
 * Authorizes a payment using loyalty points towards the loyalty system.
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
    var transactionId = orderNumber + Math.random().toString(36).substr(2);

    if (!customer.profile) {
        serverErrors.push(Resource.msg('error.customer.not.logged.in', 'loyaltyPayment', null));
    } else {
        var amount = paymentInstrument.getPaymentTransaction().getAmount();
        var pointsAmount = pointsToMoneyHelpers.moneyToPoints(amount);
        var redemptionRequest = new (require('*/cartridge/scripts/models/core/redemptionRequest'))(customer.profile, transactionId, pointsAmount);
        var requestBody = redemptionRequest.getRequestBody();

        LOGGER.info('Redeeming loyalty points. Here is the request body: {0}', requestBody);
        result = ServiceMgr.callRestService('loyalty', 'redemption', requestBody);
        if (result.status != 'OK') {
            serverErrors.push(Resource.msg('error.integration', 'loyaltyPayment', null));
        }
    }
    if (serverErrors.length == 0) {
        try {
            Transaction.wrap(function () {
                paymentInstrument.paymentTransaction.setTransactionID(transactionId);
                paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            });
        } catch (e) {
            // TODO: This is bad - we've taken the points but then crash out without refunding
            error = true;
            serverErrors.push(
                Resource.msg('error.technical', 'checkout', null)
            );
        }
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
