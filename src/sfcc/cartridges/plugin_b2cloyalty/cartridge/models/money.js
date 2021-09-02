'use strict'

var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * Convert Money to a model
 * @param {dw.value.Money} money - Money object returned from the API
 * @returns {Object} money formatted as a simple object
 */
function toMoneyModel(money) {
    var value = money.available ? money.getDecimalValue().get() : null;
    var currency = money.available ? money.getCurrencyCode() : null;
    var formattedMoney = money.available ? formatMoney(money) : null;
    var decimalPrice;
    if (formattedMoney) {
        decimalPrice = money.getDecimalValue().toString();
    }

    return {
        value: value,
        currency: currency,
        formatted: formattedMoney,
        decimalPrice: decimalPrice
    };
}

module.exports = {
    toMoneyModel: toMoneyModel
}