'use strict';

var base = require('base/checkout/billing');

/**
 * Adds loyalty to payment summary.
 * Also overrides the SFRA code that assumes the credit card always being the first payment instrument.
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    var $paymentSummary = $('.payment-details');
    var $loyaltySummary = null;
    $paymentSummary.empty();

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {

        // Add loyalty summary if existing
        if (order.billing.payment.totalByPaymentMethod.LOYALTY && order.billing.payment.totalByPaymentMethod.LOYALTY.value > 0) {
            $loyaltySummary = $('#loyalty-summary-template').clone();
            $loyaltySummary.attr('id', 'loyalty-summary');
            $loyaltySummary.removeClass('d-none');
            $('.loyalty-summary-amount', $loyaltySummary).text(order.billing.payment.totalByPaymentMethod.LOYALTY.formatted);
            $paymentSummary.append($loyaltySummary);
        }   

        // Add CC summary if existing (basically OOTB SFRA, but adapted to understand that more than CC can exist)
        var ccHtmlToAppend = '<span></span>';
        var creditCardPI = order.billing.payment.selectedPaymentInstruments.find(pi => pi.paymentMethod === 'CREDIT_CARD');
        if (creditCardPI) {
            ccHtmlToAppend += '<span>' + order.resources.cardType + ' '
                + creditCardPI.type
                + '</span><div>'
                + creditCardPI.maskedCreditCardNumber
                + '</div><div><span>'
                + order.resources.cardEnding + ' '
                + creditCardPI.expirationMonth
                + '/' + creditCardPI.expirationYear
                + '</span></div>';
        }
    } else {
        var $loyaltySummary = $('#loyalty-summary');
        if ($loyaltySummary) {
            $loyaltySummary.remove();
        }
    }
    $paymentSummary.append(ccHtmlToAppend);
}

base.methods.updatePaymentInformation = updatePaymentInformation;

module.exports = base;
