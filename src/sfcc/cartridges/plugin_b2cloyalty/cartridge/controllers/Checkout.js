'use strict';


var server = require('server');

var LoyaltyFactory = require('*/cartridge/scripts/factories/loyaltyFactory');

server.extend(module.superModule);

/**
 * Appends SFRA version to add loyalty details to the viewData
 */
 server.append(
    'Begin',
    function (req, res, next) {
        var loyaltyDetails = LoyaltyFactory.get({parts: ['pointsBalance']});
        res.setViewData({loyaltyDetails: loyaltyDetails});

        return next();
    }
);


module.exports = server.exports();
