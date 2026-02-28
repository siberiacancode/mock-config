"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "filter", {
    enumerable: true,
    get: function() {
        return filter;
    }
});
const _flat = require("flat");
const OPERATORS = {
    eq: (a, b)=>`${a}` === `${b}`,
    neq: (a, b)=>`${a}` !== `${b}`,
    gt: (a, b)=>+a > +b,
    gte: (a, b)=>+a >= +b,
    lt: (a, b)=>+a < +b,
    lte: (a, b)=>+a <= +b,
    cn: (a, b)=>a.includes(b),
    ncn: (a, b)=>!a.includes(b),
    sw: (a, b)=>a.startsWith(b),
    nsw: (a, b)=>!a.startsWith(b),
    ew: (a, b)=>a.endsWith(b),
    new: (a, b)=>!a.endsWith(b),
    some: (a, b)=>a.some((element)=>`${element}` === `${b}`)
};
const OPERATORS_KEYS = Object.keys(OPERATORS);
const OPERATOR_REGEXP = new RegExp(`^(.+)_(${OPERATORS_KEYS.join('|')})$`);
const getEntities = (object, key)=>{
    const parts = key.match(OPERATOR_REGEXP);
    if (!parts) {
        return {
            operator: 'eq',
            element: object[key]
        };
    }
    const [, element, operator] = parts;
    if (operator === 'some') {
        const array = Object.entries(object).filter(([objectKey])=>new RegExp(`^${element}.\\d$`).test(objectKey));
        return {
            operator,
            element: array.map(([, value])=>value)
        };
    }
    return {
        element: object[element],
        operator: operator
    };
};
const filter = (array, filters)=>array.filter((arrayElement)=>{
        const flattenedArrayElement = (0, _flat.flatten)(arrayElement);
        return Object.entries(filters).every(([key, filter])=>{
            if (Array.isArray(filter)) {
                const { element, operator } = getEntities(flattenedArrayElement, key);
                return filter.some((value)=>OPERATORS[operator](element, value));
            }
            const { element, operator } = getEntities(flattenedArrayElement, key);
            return OPERATORS[operator](element, filter);
        });
    });
