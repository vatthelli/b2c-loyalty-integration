'use strict';

// Initialize the middleware
var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Account-LoyaltyUnregister : The Account-LoyaltyUnregister endpoint renders the loyalty unregister page. This page allows the shopper to unregsiter the profile from loyalty program.
 * @name Base/Account-LoyaltyUnregister
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get(
    'LoyaltyUnregister',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var profileForm = server.forms.getForm('profile');
        profileForm.clear();
        res.render('account/password', {
            profileForm: profileForm,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                }
            ]
        });
        next();
    }
);

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
