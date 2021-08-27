'use strict';

/**
 * @namespace Loyalty
 */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var loyaltyEnrollment = require('*/cartridge/scripts/middleware/loyaltyEnrollment');

/**
 * Loyalty-ManageEnrollment : A link to enroll to loyalty
 * @name B2CLoyalty/Loyalty-Unregister
 * @function
 * @memberof Loyalty
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - addressId - a string used to identify the address record
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get(
    'Unregister',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    loyaltyEnrollment.validateLoyaltyEnrolled,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');

        var accountModel = accountHelpers.getAccountModel(req);

        var profileForm = server.forms.getForm('profile');
        profileForm.clear();


        res.render('account/loyalty/loyaltyUnregister', {
            profileForm: profileForm,
            account: accountModel,
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
 * Loyalty-Register : A link to unregister from loyalty
 * @name B2CLoyalty/Loyalty-Register
 * @function
 * @memberof Loyalty
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get(
    'Register',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    loyaltyEnrollment.validateLoyaltyUnregistered,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');

        var accountModel = accountHelpers.getAccountModel(req);

        var profileForm = server.forms.getForm('profile');
        profileForm.clear();


        res.render('account/loyalty/loyaltyRegister', {
            profileForm: profileForm,
            account: accountModel,
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
 * Loyalty-SaveUnregister : The Loyalty-SaveUnregister endpoint is the endpoint that gets hit when a shopper has unregister from loyalty
 * @name B2CLoyalty/Loyalty-SaveUnregister
 * @function
 * @memberof Loyalty
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'SaveUnregister',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    loyaltyEnrollment.validateLoyaltyEnrolledAjax,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var URLUtils = require('dw/web/URLUtils');

        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');

        var result = {
            isLoyaltyCustomer: false
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();

                Transaction.wrap(function () {
                    profile.custom.b2cloyalty_optInStatus = formInfo.isLoyaltyCustomer;
                });

                // Send account edited email
                accountHelpers.sendAccountEditedEmail(customer.profile);

                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('Account-Show').toString()
                });

                delete formInfo.profileForm;

                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('Account-Show').toString()
                });
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

/**
 * Loyalty-SaveEnroll : The Loyalty-SaveEnroll endpoint is the endpoint that gets hit when a shopper has enroll to loyalty
 * @name B2CLoyalty/Loyalty-SaveEnroll
 * @function
 * @memberof Loyalty
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - dwfrm_profile_customer_b2cloyaltyoptinstatus - Checkbox for whether or not a shopper wants to be enrolled into the loyalty program and agree with T&C
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'SaveEnroll',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    loyaltyEnrollment.validateLoyaltyUnregisteredAjax,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');

        // form validation
        if (!profileForm.loyalty.b2cloyaltyoptinstatus.value) {
            profileForm.valid = false;
            profileForm.loyalty.b2cloyaltyoptinstatus.valid = false;
            profileForm.loyalty.b2cloyaltyoptinstatus.error =
                Resource.msg('profile.loyalty.termsandconditions.error', 'forms', null);
        }
        var result = {
            isLoyaltyCustomer: profileForm.loyalty.b2cloyaltyoptinstatus.value
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();

                Transaction.wrap(function () {
                    profile.custom.b2cloyalty_optInStatus = formInfo.isLoyaltyCustomer;
                });

                // Send account edited email
                accountHelpers.sendAccountEditedEmail(customer.profile);

                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('Account-Show').toString()
                });

                delete formInfo.profileForm;

                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('Account-Show').toString()
                });
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.get(
    'Dashboard',
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    loyaltyEnrollment.validateLoyaltyEnrolled,
    function(req, res, next) {

    }
)

server.get(
    'MyActivities',
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    loyaltyEnrollment.validateLoyaltyEnrolled,
    function(req, res, next) {

    }
)

module.exports = server.exports();