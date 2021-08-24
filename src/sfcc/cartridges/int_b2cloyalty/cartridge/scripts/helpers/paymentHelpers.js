'use strict'

let Money = require('dw/value/Money');
let collections = require('*/cartridge/scripts/util/collections');

/**
 * Returns the amount that is not covered by payment instruments
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {dw.value.Money} A Money object denoting the remaining amount
 */
function getRemainingAmount(basket, validateTax) {
    var paymentInstruments = basket.paymentInstruments;
    var remainingAmount = basket.totalGrossPrice;
    collections.forEach(paymentInstruments, function (pi) {
        remainingAmount = remainingAmount.subtract(pi.paymentTransaction.amount);
    });
    if (remainingAmount.value < 0) {
        // Never report negative amounts even though it can happen
        remainingAmount = Money(0.0, basket.getCurrencyCode())
    }
    return remainingAmount;
}

module.exports = {
    getRemainingAmount: getRemainingAmount
}