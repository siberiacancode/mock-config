"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "sort", {
    enumerable: true,
    get: function() {
        return sort;
    }
});
const _flat = require("flat");
const DEFAULT_ORDER = 'asc';
const getOrder = (order)=>{
    if (order === 'asc' || order === 'desc') return order;
    return DEFAULT_ORDER;
};
const sortArray = (array, key, order)=>array.sort((a, b)=>{
        const flattenedA = (0, _flat.flatten)(a);
        const flattenedB = (0, _flat.flatten)(b);
        if (!flattenedA[key] || !flattenedB[key]) return 0;
        if (typeof flattenedA[key] === 'string' && typeof flattenedB[key] === 'string') {
            return order === 'asc' ? flattenedA[key].localeCompare(flattenedB[key]) : flattenedB[key].localeCompare(flattenedA[key]);
        }
        return order === 'asc' ? Number(flattenedA[key]) - Number(flattenedB[key]) : Number(flattenedB[key]) - Number(flattenedA[key]);
    });
const sort = (array, queries)=>{
    const { _sort, _order = DEFAULT_ORDER } = queries;
    if (!_sort) return array;
    const result = [
        ...array
    ];
    if (Array.isArray(_sort)) {
        const orders = Array.isArray(_order) ? _order : [
            _order
        ];
        _sort.forEach((key, index)=>{
            const order = getOrder(orders[index]);
            sortArray(result, key, order);
        });
        return result;
    }
    const order = getOrder(Array.isArray(_order) ? _order[0] : _order);
    sortArray(result, _sort, order);
    return result;
};
