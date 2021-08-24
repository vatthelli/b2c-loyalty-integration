'use strict'

var Money = require('dw/value/Money');

// TODO: Have to figure out where to get the conversion factor from
var CONVERSION_FACTOR_POINTS_TO_MONEY = 10.0;

function pointsToMoney(points, currencyCode) {
    return Money(points / CONVERSION_FACTOR_POINTS_TO_MONEY, currencyCode);
}

function moneyToPoints(money) {
    return money.value * CONVERSION_FACTOR_POINTS_TO_MONEY;
}

module.exports = {
    pointsToMoney: pointsToMoney,
    moneyToPoints: moneyToPoints
}