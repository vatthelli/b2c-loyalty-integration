'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var formatMoney = require('dw/util/StringUtils').formatMoney;
let Money = require('dw/value/Money');
var assign = require('server/assign');
var collections = require('*/cartridge/scripts/util/collections');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');


var base = module.superModule;

/**
 * Overrides SFRA version and adds formattedAmount
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value,
            formattedAmount: formatMoney(paymentInstrument.paymentTransaction.amount)
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
        remainingAmount = Money(0.0, basket.getCurrencyCode())
    }
    var results = {
        amount: remainingAmount.value,
        formattedAmount: formatMoney(remainingAmount)
    }
    return results;
}

/**
 * Payment class that represents payment information for the current basket
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
}

module.exports = Payment;
