'use strict';

var Resource = require('dw/web/Resource');
let collections = require('*/cartridge/scripts/util/collections');

var base = module.superModule;

/**
 * Validates the current user's basket before order placement. Extends the base
 * functionality, and adds a check that the combined amount of payment
 * instrument transactions cover the total order value.
 * @param {dw.order.Basket} basket - The current user's basket
 * @param {boolean} validateTax - boolean that determines whether or not to validate taxes
 * @returns {Object} an error object
 */
function validateOrder(basket, validateTax) {
    var result = base.validateOrder(basket, validateTax);
    if (!result.error) {
        var paymentInstruments = basket.paymentInstruments;

        var remainingAmount = basket.totalGrossPrice;
        var piToPayRemainder = null;

        collections.forEach(paymentInstruments, function (pi) {
            remainingAmount = remainingAmount.subtract(pi.paymentTransaction.amount);
        });
        if (remainingAmount.value > 0) {
            result.error = true;
            result.message = Resource.msg('cart.error.payment.notenough', 'cart', null);
        }
    }
    return result;
}

exports.validateOrder = validateOrder;
