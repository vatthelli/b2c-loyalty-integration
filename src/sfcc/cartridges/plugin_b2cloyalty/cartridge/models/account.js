'use strict'

var base = module.superModule;

var Customer = require('dw/customer/Customer');

/**
 * Creates a plain object that contains loyalty information
 * @param {Object} customer - current customer
 * @returns {Object} an object that contains information about the current customer's loyalty
 */
function getLoyalty(customer) {
    var result;

    if (customer.profile) {
        result = {
            isLoyaltyCustomer : customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus,
            loyaltyCustomerID: customer instanceof Customer ? customer.profile.custom.b2cloyalty_loyaltyProgramMemberId : customer.raw.profile.custom.b2cloyalty_loyaltyProgramMemberId,
        }
    } else {
        result = null;
    }
    return result;
}

/**
 * Account class that represents the current customer's profile dashboard with enhanced loyalty data
 * @param {Object} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.loyalty = getLoyalty(currentCustomer);
}

account.getCustomerPaymentInstruments = base.getCustomerPaymentInstruments;

module.exports = account;
