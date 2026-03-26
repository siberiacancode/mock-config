export const isIndex = (value: any): value is number => Number.isInteger(value) && value >= 0;
