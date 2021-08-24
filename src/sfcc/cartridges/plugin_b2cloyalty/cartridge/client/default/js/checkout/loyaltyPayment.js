'use strict';

var formHelpers = require('base/checkout/formErrors');
var scrollAnimate = require('base/components/scrollAnimate');

var exports = {
    clickLoyaltyPayment: function () {
        // Deals with the payment with loyalty points button press
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

            var paymentForm = loyaltyPaymentForm;

             // disable the next:Place Order button here
            $('body').trigger('checkout:disableButton', '.next-step-button button');

            form.spinner().start();
            $.ajax({
                url: $('#dwfrm_billing').attr('action'),
                method: 'POST',
                data: paymentForm,
                success: function (data) {
                    form.spinner().stop();
                     // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');

                    // Set the whole response to a data attribute. Will be used by subsequent logic
                    $('#dwfrm_billing').data('last-data-response', data);

                    // Always set normal payment fields to visible until confirmed that they should be hidden
                    $('.payment-information').removeClass('checkout-hidden');
                    $('.credit-card-selection-new').removeClass('checkout-hidden');

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
                    } else {
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
                        if (data && data.order && data.order.billing && data.order.billing.payment && data.order.billing.payment.selectedPaymentInstruments) {
                            $('.loyalty-amount-info-section').removeClass('checkout-hidden');
                            let pis = data.order.billing.payment.selectedPaymentInstruments;
                            let loyaltyPi = pis.find(elem => 'LOYALTY' === elem.paymentMethod);
                            $('.loyalty-amount-added').text(loyaltyPi.formattedAmount);
                            $('.loyalty-amount-remaining').text(data.order.billing.payment.remainingAmount.formattedAmount);

                            let remainingAmount = data.order.billing.payment.remainingAmount.amount;
                            $('#checkout-main').data('remaining-amount', remainingAmount);
                            if (remainingAmount <= 0) {
                                $('.payment-information').addClass('checkout-hidden');
                                $('.credit-card-selection-new').addClass('checkout-hidden');
                            }
                        }
                    }
                },
                error: function (err) {
                    form.spinner().stop();
                    $('.payment-information').removeClass('checkout-hidden');
                    $('.credit-card-selection-new').removeClass('checkout-hidden');
                    // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    if (err.responseJSON && err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                }
            });
        });
    }
};


module.exports = exports;
