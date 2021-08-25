'use strict'

var base = module.superModule;

function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.isLoyaltyCustomer = currentCustomer.raw.profile && currentCustomer.raw.profile.custom.b2cloyalty_optInStatus;
}

account.getCustomerPaymentInstruments = base.getCustomerPaymentInstruments;

module.exports = account;
