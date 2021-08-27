'use strict';

// Initialize the middleware
var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * @description Extend the SubmitRegistration method to save loyalty enroll status on customer profile level.
 * When a customer registers via the storefront -- a profile will be updated and after with b2c-crm-sync sent to the Salesforce Platform.
 *
 * @param name {String} Name of the route to modify
 * @param arguments {Function} List of functions to be appended
 * @param {httpparameter} - dwfrm_profile_customer_b2cloyaltyoptinstatus - Checkbox for whether or not a shopper wants to be enrolled into the loyalty program
 */
server.append('SubmitRegistration', function (req, res, next) {
    this.on('route:BeforeComplete', function () {
        if (customer.isAuthenticated() && require('dw/system/HookMgr').hasHook('app.customer.created')) {
            var Transaction = require('dw/system/Transaction');
            var registrationForm = server.forms.getForm('profile');
            var customerProfile = customer.getProfile();

            // Update an user with loyalty enroll information.
            Transaction.wrap(function () {
                customerProfile.custom.b2cloyalty_optInStatus = registrationForm.loyalty.b2cloyaltyoptinstatus.value;
            });

        }
    });
    next();
});

module.exports = server.exports();
