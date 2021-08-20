'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var array = require('*/cartridge/scripts/util/array');

    var viewData = viewFormData;
    // var creditCardErrors = {};
    // creditCardErrors = COHelpers.validateCreditCard(paymentForm);
    // if (Object.keys(creditCardErrors).length) {
    //     return {
    //         fieldErrors: creditCardErrors,
    //         error: true
    //     };
    // }


    var loyaltyFormErrors = COHelpers.validateFields(paymentForm.loyaltyPaymentFields);
    if (Object.keys(loyaltyFormErrors).length) {
        //formFieldErrors.push(loyaltyFormErrors);
        return {
            fieldErrors: loyaltyFormErrors,
            error: true
        };
    }

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    viewData.paymentInformation = {
        amount: {
            value: paymentForm.loyaltyPaymentFields.amount.value,
            htmlName: paymentForm.loyaltyPaymentFields.amount.htmlName
        }
    };

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
