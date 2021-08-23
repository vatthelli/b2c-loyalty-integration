'use strict';

var formHelpers = require('base/checkout/formErrors');
var scrollAnimate = require('base/components/scrollAnimate');

var exports = {
    clickLoyaltyPayment: function () {
        $('#submit-loyaltypayment').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var form = $(this);

            var loyaltyPaymentForm = $('#dwfrm_billing .loyalty-payment-form-fields :input').serialize();

            $('body').trigger('checkout:serializeBilling', {
                form: $('#dwfrm_billing .loyalty-payment-form-fields'),
                data: loyaltyPaymentForm,
                callback: function (data) {
                    if (data) {
                        loyaltyPaymentForm = data;
                    }
                }
            });

            //var paymentForm = billingAddressForm + '&' + contactInfoForm + '&' + paymentInfoForm;
            var paymentForm = loyaltyPaymentForm;

             // disable the next:Place Order button here
            $('body').trigger('checkout:disableButton', '.next-step-button button');

            console.log('PAYMENT AJAX NEW');
            var defer = $.Deferred();
            form.spinner().start();
            $.ajax({
                url: $('#dwfrm_billing').attr('action'),
                method: 'POST',
                data: paymentForm,
                success: function (data) {
                    form.spinner().stop();
                     // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    // look for field validation errors
                    if (data.error) {
                        if (data.fieldErrors.length) {
                            data.fieldErrors.forEach(function (error) {
                                if (Object.keys(error).length) {
                                    formHelpers.loadFormErrors('.loyalty-payment-form', error);
                                }
                            });
                        }

                        if (data.serverErrors.length) {
                            data.serverErrors.forEach(function (error) {
                                $('.error-message').show();
                                $('.error-message-text').text(error);
                                scrollAnimate($('.error-message'));
                            });
                        }

                        if (data.cartError) {
                            window.location.href = data.redirectUrl;
                        }

                        defer.reject();
                    } else {
                        //
                        // Populate the Address Summary
                        //
                        $('body').trigger('checkout:updateCheckoutView',
                            { order: data.order, customer: data.customer });

                        if (data.renderedPaymentInstruments) {
                            $('.stored-payments').empty().html(
                                data.renderedPaymentInstruments
                            );
                        }

                        if (data.customer.registeredUser
                            && data.customer.customerPaymentInstruments.length
                        ) {
                            $('.cancel-new-payment').removeClass('checkout-hidden');
                        }
                        if (true) {
                            console.log('Getting here at least!');
                            let pis = data.order.billing.payment.selectedPaymentInstruments;
                            let loyaltyPi = pis.find(elem => 'LOYALTY' === elem.paymentMethod);
                            $('.loyalty-amount-added').text(loyaltyPi.amount);
                        }

                        //scrollAnimate();
                        defer.resolve(data);
                    }
                },
                error: function (err) {
                    form.spinner().stop();
                    // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    if (err.responseJSON && err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                }
            });




        });
    },


};


module.exports = exports;
