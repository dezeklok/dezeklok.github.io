angular.module('cmodule.filters', []).
        filter('checkmark', function () {
            return function (input) {
                return input ? '\u2713' : '\u2718';
            };
        })
        .filter('status', function () {
            return function (input, status) {
                return input == status ? '\u2713' : '\u2718';
            };
        })
        .filter('statusClass', function () {
            return function (input, status) {
                return input == status ? 'on' : 'off';
            };
        })
        .filter('capitalize', function () {
            return function (input) {
                return input.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                    return letter.toUpperCase();
                });
            };
        })
        .filter('oneCapLetter', function () {
            return function (input) {
                return input.substring(0, 1).toLowerCase().replace(/\b[a-z]/g, function (letter) {
                    return letter.toUpperCase();
                });
            };
        })
        .filter('htmlToPlaintext', function () {
            return function (text) {
                return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
            };
        })
        .filter('cut', function () {
            return function (value, wordwise, max, tail) {
                if (!value)
                    return '';

                max = parseInt(max, 10);
                if (!max)
                    return value;
                if (value.length <= max)
                    return value;

                value = value.substr(0, max);
                if (wordwise) {
                    var lastspace = value.lastIndexOf(' ');
                    if (lastspace != -1) {
                        value = value.substr(0, lastspace);
                    }
                }

                return value + (tail || ' …');
            };
        })
        .filter('dateToTimestamp', function () {
            return function (inputDate) {
                var dateParts = inputDate.split('-');

                return new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2]);
            };
        })
        .filter('datetimeToTimestamp', function () {
            return function (inputDate) {
                var dateTimeParts = inputDate.split(' '),
                        timeParts = dateTimeParts[1].split(':'),
                        dateParts = dateTimeParts[0].split('-');

                return new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1]);
            };
        })
        .filter('newlines', function () {
            return function (text) {
                return text.replace(/\n/g, '<br/>');
            }
        });

angular.module('cmodule.services', []).
        factory('alertService', function () {
            return {
                showMessage: false,
                message: '',
                showErrors: false,
                errors: ''
            };
        }).
        factory('filterService', function () {
            return {
                keywords: '',
                roles: [],
                agents: [],
                tags: [],
                offset: 0
            };
        });

