'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = Code.expect;
const it = lab.it;
const describe = lab.describe;
const beforeEach = lab.beforeEach;

describe('helper registration', () => {
    let helpers;

    beforeEach(done => {
        helpers = require('../helpers');
        done();
    });

    it('loads all the helpers', done => {
        const expectedHelpers = [
            'all',
            'any',
            'block',
            'cdn',
            'compare',
            'concat',
            'contains',
            'dynamicComponent',
            'for',
            'getFontLoaderConfig',
            'getFontsCollection',
            'getImage',
            'getImageSrcset',
            'helperMissing',
            'if',
            'inject',
            'join',
            'jsContext',
            'json',
            'lang',
            'langJson',
            'limit',
            'money',
            'nl2br',
            'or',
            'partial',
            'pluck',
            'pre',
            'region',
            'replace',
            'resourceHints',
            'setURLQueryParam',
            'snippet',
            'stripQuerystring',
            'stylesheet',
            'after',
            'arrayify',
            'before',
            'eachIndex',
            'filter',
            'first',
            'forEach',
            'inArray',
            'isArray',
            'last',
            'lengthEqual',
            'map',
            'some',
            'sort',
            'sortBy',
            'withAfter',
            'withBefore',
            'withFirst',
            'withLast',
            'withSort',
            'isEmpty',
            'iterate',
            'length',
            'and',
            'gt',
            'gte',
            'has',
            'eq',
            'ifEven',
            'ifNth',
            'ifOdd',
            'is',
            'isnt',
            'lt',
            'lte',
            'neither',
            'unlessEq',
            'unlessGt',
            'unlessLt',
            'unlessGteq',
            'unlessLteq',
            'moment',
            'ellipsis',
            'sanitize',
            'ul',
            'ol',
            'thumbnailImage',
            'inflect',
            'ordinalize',
            'markdown',
            'add',
            'subtract',
            'divide',
            'multiply',
            'floor',
            'ceil',
            'round',
            'sum',
            'avg',
            'default',
            'option',
            'noop',
            'withHash',
            'addCommas',
            'phoneNumber',
            'random',
            'toAbbr',
            'toExponential',
            'toFixed',
            'toFloat',
            'toInt',
            'toPrecision',
            'extend',
            'forIn',
            'forOwn',
            'toPath',
            'get',
            'getObject',
            'hasOwn',
            'isObject',
            'merge',
            'JSONparse',
            'JSONstringify',
            'camelcase',
            'capitalize',
            'capitalizeAll',
            'center',
            'chop',
            'dashcase',
            'dotcase',
            'hyphenate',
            'isString',
            'lowercase',
            'occurrences',
            'pascalcase',
            'pathcase',
            'plusify',
            'reverse',
            'sentence',
            'snakecase',
            'split',
            'startsWith',
            'titleize',
            'trim',
            'uppercase',
            'encodeURI',
            'decodeURI',
            'urlResolve',
            'urlParse',
            'stripProtocol',
            'toLowerCase',
            'truncate',
            'unless',
            'enumerate',
            'equals',
            'getShortMonth',
            'pick',
        ];

        expect(helpers.map(helper => helper.name)).to.be.equal(expectedHelpers);
        done();
    });
});
