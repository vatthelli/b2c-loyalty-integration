'use strict';

var assign = require('server/assign');
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Transaction = require('dw/system/Transaction');
let collections = require('*/cartridge/scripts/util/collections');
let CONSTANTS = require('*/cartridge/scripts/loyaltyConstants');

var base = module.superModule;


/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
 function calculatePaymentTransaction(currentBasket) {
    if (currentBasket.paymentInstruments.length == 1) {
        return base.calculatePaymentTransaction(currentBasket);
    }
    var result = { error: false };
    var paymentInstruments = currentBasket.paymentInstruments;

    var remainingAmount = currentBasket.totalGrossPrice;
    var piToPayRemainder = null;

    collections.forEach(paymentInstruments, function (pi) {
        if (PaymentInstrument.METHOD_CREDIT_CARD.equals(pi.paymentMethod)) {
            // Use CC to pay for remainder. Also, ignore any amount that may
            // already have been set. This way we can reconfigure payment
            // integrations that assume they pay the full amount
            piToPayRemainder = pi;
        }
        else if (pi.paymentTransaction.amount) {
            remainingAmount = remainingAmount.subtract(pi.paymentTransaction.amount);
        } else {
            // Non-CC without amount set, not allowed
            result.error = true;
        }
    });

    if (!result.error && remainingAmount.value > 0 && piToPayRemainder) {
        try {
            Transaction.wrap(function () {
                piToPayRemainder.paymentTransaction.setAmount(remainingAmount);
            });
        } catch (e) {
            var error = e;
            result.error = true;
        }
    }
    return result;
}


// This version assumes all payments are in place, which is not true as it's also called from SubmitPayment
// /**
//  * Sets the payment transaction amount
//  * @param {dw.order.Basket} currentBasket - The current basket
//  * @returns {Object} an error object
//  */
// function calculatePaymentTransaction(currentBasket) {
//     if (currentBasket.paymentInstruments.length == 1) {
//         return base.calculatePaymentTransaction(currentBasket);
//     }
//     var result = { error: false };
//     var paymentInstruments = currentBasket.paymentInstruments;

//     var remainingAmount = currentBasket.totalGrossPrice;
//     var piToPayRemainder = null;

//     collections.forEach(paymentInstruments, function (pi) {
//         if (PaymentInstrument.METHOD_CREDIT_CARD.equals(pi.paymentMethod)) {
//             // Use CC to pay for remainder. Also, ignore any amount that may
//             // already have been set. This way we can reconfigure payment
//             // integrations that assume they pay the full amount
//             piToPayRemainder = pi;
//         }
//         else if (pi.paymentTransaction.amount) {
//             remainingAmount = remainingAmount.subtract(pi.paymentTransaction.amount);
//         } else {
//             // Non-CC without amount set, not allowed
//             result.error = true;
//         }
//     });

//     if (!result.error && remainingAmount.value > 0 && !piToPayRemainder) {
//         // There is a remaining amount but no payment instrument to pay for it
//         result.error = true;
//     }

//     if (!result.error && remainingAmount.value > 0) {
//         try {
//             Transaction.wrap(function () {
//                 piToPayRemainder.paymentTransaction.setAmount(remainingAmount);
//             });
//         } catch (e) {
//             result.error = true;
//         }
//     }
//     return result;
// }

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var countryCode = req.geolocation.countryCode;
    var currentCustomer = req.currentCustomer.raw;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount
    );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        paymentAmount
    );

    var invalid = true;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            invalid = false;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if (CONSTANTS.LOYALTY_PAYMENT_METHOD_ID.equals(paymentInstrument.paymentMethod)) {
                continue;
            }
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);

                // Checks whether payment card is still applicable.
                if (card && applicablePaymentCards.contains(card)) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

module.exports = assign(base, {
    calculatePaymentTransaction: calculatePaymentTransaction,
    validatePayment: validatePayment
});