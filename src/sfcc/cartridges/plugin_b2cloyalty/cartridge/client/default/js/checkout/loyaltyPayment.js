'use strict';

var formHelpers = require('base/checkout/formErrors');
var scrollAnimate = require('base/components/scrollAnimate');

function updateLoyaltyFieldsOnResponse(data) {
    // Always set normal payment fields to visible until confirmed that they should be hidden
    $('.payment-information').removeClass('checkout-hidden');
    $('.credit-card-selection-new').removeClass('checkout-hidden');

    $('.loyalty-amount-info-section').addClass('checkout-hidden');
    
    if (data && data.order && data.order.billing && data.order.billing.payment && data.order.billing.payment.selectedPaymentInstruments) {

        // Payment page
        if (data.order.billing.payment.totalByPaymentMethod.LOYALTY && data.order.billing.payment.totalByPaymentMethod.LOYALTY.value > 0) {
            $('.loyalty-amount-added').text(data.order.billing.payment.totalByPaymentMethod.LOYALTY.formatted);
            $('.loyalty-amount-info-section').removeClass('checkout-hidden');
            $('.loyalty-amount-remaining').text(data.order.billing.payment.remainingAmount.formatted);

            let remainingAmount = data.order.billing.payment.remainingAmount.value;
            $('#checkout-main').data('remaining-amount', remainingAmount);
            if (remainingAmount <= 0) {
                $('.payment-information').addClass('checkout-hidden');
                $('.credit-card-selection-new').addClass('checkout-hidden');
            }        
        }    
    } else {
        $('.loyalty-amount-added').text('');
        $('.loyalty-amount-remaining').text('');
    }
}

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
                    $('body').trigger('checkout:enableButton', '.next-step-button button');

                    // look for field validation errors
                    if (data.error) {
                        // Explicitly call function to update loyalty fields below. This is because
                        // checkout:updateCheckoutView event should not be triggered on data errors
                        updateLoyaltyFieldsOnResponse(data);
                        if (data.fieldErrors.length) {
                            data.fieldErrors.forEach(function (error) {
                                if (Object.keys(error).length) {
                                    formHelpers.loadFormErrors('.loyalty-payment-form-fields', error);
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
    },
    updateCheckoutViewForLoyalty: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            updateLoyaltyFieldsOnResponse(data);
        });
    }
};


module.exports = exports;
