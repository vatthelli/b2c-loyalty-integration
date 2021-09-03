'use strict'

let Money = require('dw/value/Money');
let CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');
let collections = require('*/cartridge/scripts/util/collections');

/**
 * Returns the amount that is not covered by payment instruments
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {dw.value.Money} A Money object denoting the remaining amount
 */
function getRemainingAmount(basket) {
    var paymentInstruments = basket.paymentInstruments;
    var remainingAmount = basket.totalGrossPrice;
    collections.forEach(paymentInstruments, function (pi) {
        remainingAmount = remainingAmount.subtract(pi.paymentTransaction.amount);
    });
    return remainingAmount;
}

/**
 * Returns the amount that needs to be paid by "proper" payment instruments, the definition here
 * being the PI to pay the remainder after loyalty (and perhaps gift cards) have been applied.
 * This number can be used to display the total in the order summary, to show the remaining amount
 * that will be paid by the payment instrument that pays for "the rest".
 * There's a good chance this function needs to be extended in customer projects.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {dw.value.Money} A Money object
 */
 function getTotalExcludingNonProperPaymentMethods(basket) {
    var paymentInstruments = basket.paymentInstruments;
    var remainingAmount = basket.totalGrossPrice;
    collections.forEach(paymentInstruments, function (pi) {
        if (CONSTANTS.LOYALTY_PAYMENT_METHOD_ID === pi.paymentMethod) {
            remainingAmount = remainingAmount.subtract(pi.paymentTransaction.amount);
        }
    });
    return remainingAmount;
}

module.exports = {
    getRemainingAmount: getRemainingAmount,
    getTotalExcludingNonProperPaymentMethods: getTotalExcludingNonProperPaymentMethods
}