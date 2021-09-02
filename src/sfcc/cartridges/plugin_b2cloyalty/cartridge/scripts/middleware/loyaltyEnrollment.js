'use strict';

var URLUtils = require('dw/web/URLUtils');
var Customer = require('dw/customer/Customer');

/**
 * Middleware validating if user enrolled into loyalty
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoyaltyEnrolled(req, res, next) {
    var customer = req.currentCustomer;
    var isLoyaltyCustomer = customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus
    if (!isLoyaltyCustomer) {
        res.redirect(URLUtils.url('Account-Show'));
    }

    next();
}

/**
 * Middleware validating if user unregistered from loyalty
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoyaltyUnregistered(req, res, next) {
    var customer = req.currentCustomer;
    var isLoyaltyCustomer = customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus
    if (isLoyaltyCustomer) {
        res.redirect(URLUtils.url('Account-Show'));
    }

    next();
}

/**
 * Middleware validating if user enrolled into loyalty from ajax request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoyaltyEnrolledAjax(req, res, next) {
    var customer = req.currentCustomer;
    var isLoyaltyCustomer = customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus
    if (!isLoyaltyCustomer) {
        res.setStatusCode(500);
        res.setViewData({
            isLoyaltyCustomer: false,
            redirectUrl: URLUtils.url('Account-Show').toString()
        });
    } else {
        res.setViewData({
            isLoyaltyCustomer: true
        });
    }

    next();
}

/**
 * Middleware validating if user unregistered into loyalty from ajax request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoyaltyUnregisteredAjax(req, res, next) {
    var customer = req.currentCustomer;
    var isLoyaltyCustomer = customer instanceof Customer ? customer.profile.custom.b2cloyalty_optInStatus : customer.raw.profile.custom.b2cloyalty_optInStatus
    if (isLoyaltyCustomer) {
        res.setStatusCode(500);
        res.setViewData({
            isLoyaltyCustomer: true,
            redirectUrl: URLUtils.url('Account-Show').toString()
        });
    } else {
        res.setViewData({
            isLoyaltyCustomer: false
        });
    }

    next();
}

module.exports = {
    validateLoyaltyEnrolled: validateLoyaltyEnrolled,
    validateLoyaltyUnregistered: validateLoyaltyUnregistered,
    validateLoyaltyEnrolledAjax: validateLoyaltyEnrolledAjax,
    validateLoyaltyUnregisteredAjax: validateLoyaltyUnregisteredAjax
};
