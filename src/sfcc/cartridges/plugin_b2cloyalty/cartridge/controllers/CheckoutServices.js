'use strict';

const PAYMENT_METHOD_ID_LOYALTY = 'LOYALTY';

var server = require('server');
server.extend(module.superModule);

/**
 *  Handle Ajax payment (and billing) form submit
 */
/**
 * CheckoutServices-SubmitPayment : The CheckoutServices-SubmitPayment endpoint will submit the payment information and render the checkout place order page allowing the shopper to confirm and place the order
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - addressSelector - For Guest shopper: A shipment UUID that contains address that matches the selected address. For returning shopper: ab_<address-name-from-address-book>" of the selected address. For both type of shoppers:  "new" if a brand new address is entered
 * @param {httpparameter} - dwfrm_billing_addressFields_firstName - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_billing_addressFields_lastName - Input field for the shoppers's last name
 * @param {httpparameter} - dwfrm_billing_addressFields_address1 - Input field for the shoppers's address 1 - street
 * @param {httpparameter} - dwfrm_billing_addressFields_address2 - Input field for the shoppers's address 2 - street
 * @param {httpparameter} - dwfrm_billing_addressFields_country - Input field for the shoppers's address - country
 * @param {httpparameter} - dwfrm_billing_addressFields_states_stateCode - Input field for the shoppers's address - state code
 * @param {httpparameter} - dwfrm_billing_addressFields_city - Input field for the shoppers's address - city
 * @param {httpparameter} - dwfrm_billing_addressFields_postalCode - Input field for the shoppers's address - postal code
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {httpparameter} - localizedNewAddressTitle - label for new address
 * @param {httpparameter} - dwfrm_billing_contactInfoFields_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_billing_contactInfoFields_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_billing_paymentMethod - Input field for the shopper's payment method
 * @param {httpparameter} - dwfrm_billing_creditCardFields_cardType - Input field for the shopper's credit card type
 * @param {httpparameter} - dwfrm_billing_creditCardFields_cardNumber - Input field for the shopper's credit card number
 * @param {httpparameter} - dwfrm_billing_creditCardFields_expirationMonth - Input field for the shopper's credit card expiration month
 * @param {httpparameter} - dwfrm_billing_creditCardFields_expirationYear - Input field for the shopper's credit card expiration year
 * @param {httpparameter} - dwfrm_billing_creditCardFields_securityCode - Input field for the shopper's credit card security code
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
// server.prepend(
//     'SubmitPayment',
//     function (req, res, next) {
//         var PaymentManager = require('dw/order/PaymentMgr');
//         var HookManager = require('dw/system/HookMgr');
//         var Resource = require('dw/web/Resource');
//         var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

//         var viewData = {};
//         var paymentForm = server.forms.getForm('billing');

//         var paymentMethodIdValue = paymentForm.paymentMethod.value;
//         if (!PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
//             throw new Error(Resource.msg(
//                 'error.payment.processor.missing',
//                 'checkout',
//                 null
//             ));
//         }
//         if (PAYMENT_METHOD_ID_LOYALTY !== paymentMethodIdValue) {
//             // We're only interested in loyalty here
//             return next();
//         }

//         var loyaltyFormErrors = COHelpers.validateFields(paymentForm.loyaltyPaymentFields);
//         var formFieldErrors = [];
//         if (Object.keys(loyaltyFormErrors).length) {
//             formFieldErrors.push(loyaltyFormErrors);
//         }

//         if (formFieldErrors.length) {
//             // respond with form data and errors
//             res.json({
//                 form: paymentForm,
//                 fieldErrors: formFieldErrors,
//                 serverErrors: [],
//                 error: true
//             });
//             // Validation error on loyalty form. Return without calling next()
//             return next();
//         }

//         // Successful loyalty validation. Continue
//         return next();
//     }
// );


module.exports = server.exports();
