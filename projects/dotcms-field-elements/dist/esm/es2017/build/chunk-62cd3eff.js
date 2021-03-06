import { h } from '../dotcmsfields.core.js';

function getClassNames(status, isValid, required) {
    return {
        'dot-valid': isValid,
        'dot-invalid': !isValid,
        'dot-pristine': status.dotPristine,
        'dot-dirty': !status.dotPristine,
        'dot-touched': status.dotTouched,
        'dot-untouched': !status.dotTouched,
        'dot-required': required
    };
}
function isStringType(val) {
    return typeof val === 'string' && !!val;
}
function getDotOptionsFromFieldValue(rawString) {
    if (!isStringType(rawString)) {
        return [];
    }
    rawString = rawString.replace(/(?:\\[rn]|[\r\n]+)+/g, ',');
    const items = isKeyPipeValueFormatValid(rawString)
        ? rawString
            .split(',')
            .filter((item) => !!item.length)
            .map((item) => {
            const [label, value] = item.split('|');
            return { label, value };
        })
        : [];
    return items;
}
function getErrorClass(valid) {
    return valid ? undefined : 'dot-field__error';
}
function getHintId(name) {
    const value = slugify(name);
    return value ? `hint-${value}` : undefined;
}
function getId(name) {
    const value = slugify(name);
    return name ? `dot-${slugify(value)}` : undefined;
}
function getLabelId(name) {
    const value = slugify(name);
    return value ? `label-${value}` : undefined;
}
function getOriginalStatus(isValid) {
    return {
        dotValid: typeof isValid === 'undefined' ? true : isValid,
        dotTouched: false,
        dotPristine: true
    };
}
function getStringFromDotKeyArray(values) {
    return values.map((item) => `${item.key}|${item.value}`).join(',');
}
function updateStatus(state, change) {
    return Object.assign({}, state, change);
}
function getTagError(show, message) {
    return show && isStringType(message) ? (h("span", { class: "dot-field__error-message" }, message)) : null;
}
function getTagHint(hint) {
    return isStringType(hint) ? (h("span", { class: "dot-field__hint", id: getHintId(hint) }, hint)) : null;
}
function isValidURL(url) {
    try {
        return !!new URL(url);
    }
    catch (e) {
        return false;
    }
}
function isFileAllowed(fileName, allowedExtensions) {
    let allowedExtensionsArray = allowedExtensions.split(',');
    allowedExtensionsArray = allowedExtensionsArray.map((item) => item.trim());
    const extension = fileName ? fileName.substring(fileName.indexOf('.'), fileName.length) : '';
    return allowAnyFile(allowedExtensionsArray) || allowedExtensionsArray.includes(extension);
}
function allowAnyFile(allowedExtensions) {
    return allowedExtensions[0] === '' || allowedExtensions.includes('*');
}
function slugify(text) {
    return text
        ? text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
        : null;
}
function isKeyPipeValueFormatValid(rawString) {
    const regex = /([^|,]*)\|([^|,]*)/;
    const items = rawString.split(',');
    let valid = true;
    for (let i = 0, total = items.length; i < total; i++) {
        if (!regex.test(items[i])) {
            valid = false;
            break;
        }
    }
    return valid;
}

const DATE_REGEX = new RegExp('^\\d\\d\\d\\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])');
const TIME_REGEX = new RegExp('^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])$');
function dotValidateDate(date) {
    return DATE_REGEX.test(date) ? date : null;
}
function dotValidateTime(time) {
    return TIME_REGEX.test(time) ? time : null;
}
function dotParseDate(data) {
    const [dateOrTime, time] = data ? data.split(' ') : '';
    return {
        date: dotValidateDate(dateOrTime),
        time: dotValidateTime(time) || dotValidateTime(dateOrTime)
    };
}
function isValidDateSlot(dateSlot, rawData) {
    return !!rawData
        ? rawData.split(' ').length > 1
            ? isValidFullDateSlot(dateSlot)
            : isValidPartialDateSlot(dateSlot)
        : false;
}
function isValidFullDateSlot(dateSlot) {
    return !!dateSlot.date && !!dateSlot.time;
}
function isValidPartialDateSlot(dateSlot) {
    return !!dateSlot.date || !!dateSlot.time;
}

class DotFieldPropError extends Error {
    constructor(propInfo, expectedType) {
        super(`Warning: Invalid prop "${propInfo.name}" of type "${typeof propInfo.value}" supplied to "${propInfo.field.type}" with the name "${propInfo.field.name}", expected "${expectedType}".
Doc Reference: https://github.com/dotCMS/core-web/blob/master/projects/dotcms-field-elements/src/components/${propInfo.field.type}/readme.md`);
        this.propInfo = propInfo;
    }
    getProps() {
        return Object.assign({}, this.propInfo);
    }
}

function stringValidator(propInfo) {
    if (typeof propInfo.value !== 'string') {
        throw new DotFieldPropError(propInfo, 'string');
    }
}
function regexValidator(propInfo) {
    try {
        RegExp(propInfo.value.toString());
    }
    catch (e) {
        throw new DotFieldPropError(propInfo, 'valid regular expression');
    }
}
function numberValidator(propInfo) {
    if (isNaN(Number(propInfo.value))) {
        throw new DotFieldPropError(propInfo, 'Number');
    }
}
function dateValidator(propInfo) {
    if (!dotValidateDate(propInfo.value.toString())) {
        throw new DotFieldPropError(propInfo, 'Date');
    }
}
const areRangeDatesValid = (start, end, propInfo) => {
    if (start > end) {
        throw new DotFieldPropError(propInfo, 'Date');
    }
};
function dateRangeValidator(propInfo) {
    const [start, end] = propInfo.value.toString().split(',');
    if (!dotValidateDate(start) || !dotValidateDate(end)) {
        throw new DotFieldPropError(propInfo, 'Date');
    }
    areRangeDatesValid(new Date(start), new Date(end), propInfo);
}
function timeValidator(propInfo) {
    if (!dotValidateTime(propInfo.value.toString())) {
        throw new DotFieldPropError(propInfo, 'Time');
    }
}
function dateTimeValidator(propInfo) {
    if (typeof propInfo.value === 'string') {
        const dateSlot = dotParseDate(propInfo.value);
        if (!isValidDateSlot(dateSlot, propInfo.value)) {
            throw new DotFieldPropError(propInfo, 'Date/Time');
        }
    }
    else {
        throw new DotFieldPropError(propInfo, 'Date/Time');
    }
}

const PROP_VALIDATION_HANDLING = {
    date: dateValidator,
    dateRange: dateRangeValidator,
    dateTime: dateTimeValidator,
    number: numberValidator,
    options: stringValidator,
    regexCheck: regexValidator,
    step: stringValidator,
    string: stringValidator,
    time: timeValidator,
    type: stringValidator,
    accept: stringValidator
};
const FIELDS_DEFAULT_VALUE = {
    options: '',
    regexCheck: '',
    value: '',
    min: '',
    max: '',
    step: '',
    type: 'text',
    accept: null
};
function validateProp(propInfo, validatorType) {
    if (!!propInfo.value) {
        PROP_VALIDATION_HANDLING[validatorType || propInfo.name](propInfo);
    }
}
function getPropInfo(element, propertyName) {
    return {
        value: element[propertyName],
        name: propertyName,
        field: {
            name: element['name'],
            type: element['el'].tagName.toLocaleLowerCase()
        }
    };
}
function checkProp(component, propertyName, validatorType) {
    const proInfo = getPropInfo(component, propertyName);
    try {
        validateProp(proInfo, validatorType);
        return component[propertyName];
    }
    catch (error) {
        console.warn(error.message);
        return FIELDS_DEFAULT_VALUE[propertyName];
    }
}

export { getOriginalStatus as a, checkProp as b, getClassNames as c, getTagHint as d, getTagError as e, updateStatus as f, isFileAllowed as g, getHintId as h, getErrorClass as i, isValidURL as j, getId as k, getStringFromDotKeyArray as l, isStringType as m, getDotOptionsFromFieldValue as n, dotParseDate as o, getLabelId as p };
