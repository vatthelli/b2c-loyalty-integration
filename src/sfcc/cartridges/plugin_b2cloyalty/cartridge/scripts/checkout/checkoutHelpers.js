'use strict';

var assign = require('server/assign');
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

var base = module.superModule;

/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
 function calculatePaymentTransaction(currentBasket) {
    var result = { error: false };

    // try {
    //     // TODO: This function will need to account for gift certificates at a later date
    //     Transaction.wrap(function () {
    //         var paymentInstruments = currentBasket.paymentInstruments;

    //         if (!paymentInstruments.length) {
    //             return;
    //         }

    //         // Assuming that there is only one payment instrument used for the total order amount.
    //         // TODO: Will have to rewrite this logic once we start supporting multiple payment instruments for same order
    //         var orderTotal = currentBasket.totalGrossPrice;
    //         var paymentInstrument = paymentInstruments[0];

    //         paymentInstrument.paymentTransaction.setAmount(orderTotal);
    //     });
    // } catch (e) {
    //     result.error = true;
    // }

    return result;
}

module.exports = assign(base, {
    calculatePaymentTransaction: calculatePaymentTransaction
});