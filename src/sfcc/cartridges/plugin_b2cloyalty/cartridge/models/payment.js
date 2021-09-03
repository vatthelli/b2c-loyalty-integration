'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var formatMoney = require('dw/util/StringUtils').formatMoney;
let Money = require('dw/value/Money');
var assign = require('server/assign');
var collections = require('*/cartridge/scripts/util/collections');
let CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
var moneyModel = require('*/cartridge/models/money');
var pointsToMoneyHelpers = require('*/cartridge/scripts/helpers/pointsToMoneyHelpers');

var base = module.superModule;

/**
 * Overrides SFRA version and adds amountMoney
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value,
            amountMoney: moneyModel.toMoneyModel(paymentInstrument.paymentTransaction.amount)
        };
        if (paymentInstrument.paymentMethod === 'CREDIT_CARD') {
            results.lastFour = paymentInstrument.creditCardNumberLastDigits;
            results.owner = paymentInstrument.creditCardHolder;
            results.expirationYear = paymentInstrument.creditCardExpirationYear;
            results.type = paymentInstrument.creditCardType;
            results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
            results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
        } else if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        }

        return results;
    });
}

/**
 * Retrieves an object with the remaining amount as a number and as a formatted string.
 * @param {dw.order.Basket} currentBasket 
 * @returns Object with remaining amount
 */
function getRemainingAmount(currentBasket) {
    var remainingAmount = paymentHelpers.getRemainingAmount(currentBasket);
    if (remainingAmount.value < 0) {
        // Never report negative amounts to the front end even though it can happen
        remainingAmount = Money(0.0, currentBasket.getCurrencyCode());
    }
    return moneyModel.toMoneyModel(remainingAmount);
}

/**
 * Retrieves an object with the remaining amount as a number and as a formatted string.
 * @param {dw.order.Basket} currentBasket 
 * @returns Object with remaining amount
 */
 function getTotalExcludingNonProperPaymentMethods(currentBasket) {
    var remainingAmount = paymentHelpers.getTotalExcludingNonProperPaymentMethods(currentBasket);
    if (remainingAmount.value < 0) {
        // Never report negative amounts to the front end even though it can happen
        remainingAmount = Money(0.0, currentBasket.getCurrencyCode());
    }
    return moneyModel.toMoneyModel(remainingAmount);
}

function getTotalByPaymentMethod(paymentInstruments, currencyCode) {
    var result = {};
    collections.forEach(paymentInstruments, function (pi) {
        var currentTotalModel = result[pi.paymentMethod];
        var newTotalMoney = currentTotalModel ? Money(currentTotalModel.value, currencyCode).add(pi.paymentTransaction.amount) : pi.paymentTransaction.amount;
        result[pi.paymentMethod] = moneyModel.toMoneyModel(newTotalMoney);
    });
    return result;
}

function getTotalLoyaltyPointsApplied(paymentInstruments, currencyCode) {
    var totalLoyaltyMoneyAmount = Money(0.0, currencyCode);
    collections.forEach(paymentInstruments, function (pi) {
        if (pi.paymentMethod === CONSTANTS.LOYALTY_PAYMENT_METHOD_ID) {
            totalLoyaltyMoneyAmount = totalLoyaltyMoneyAmount.add(pi.paymentTransaction.amount);
        }
    });
    return pointsToMoneyHelpers.moneyToPoints(totalLoyaltyMoneyAmount);
}

/**
 * Overrides SFRA and adds the functions listed above.
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    var paymentInstruments = currentBasket.paymentInstruments;
    this.selectedPaymentInstruments = paymentInstruments ?
        getSelectedPaymentInstruments(paymentInstruments) : null;

    this.remainingAmount = getRemainingAmount(currentBasket);
    this.totalExcludingNonProperPaymentMethods = getTotalExcludingNonProperPaymentMethods(currentBasket);
    this.totalByPaymentMethod = getTotalByPaymentMethod(currentBasket.paymentInstruments, currentBasket.getCurrencyCode());
    this.totalLoyaltyPointsApplied = getTotalLoyaltyPointsApplied(currentBasket.paymentInstruments, currentBasket.getCurrencyCode());
}

module.exports = Payment;
