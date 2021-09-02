'use strict'

var base = module.superModule;

var LoyaltyFactory = require('*/cartridge/scripts/factories/loyaltyFactory');

/**
 * Account class that represents the current customer's profile dashboard with enhanced loyalty data
 * @param {Object} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.loyalty = LoyaltyFactory.get({parts: ['base']});
}

account.getCustomerPaymentInstruments = base.getCustomerPaymentInstruments;

module.exports = account;
