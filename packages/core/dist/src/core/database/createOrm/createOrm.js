"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createOrm", {
    enumerable: true,
    get: function() {
        return createOrm;
    }
});
const _flat = require("flat");
const _helpers = require("../createDatabaseRoutes/helpers");
const createOrm = (storage)=>{
    const { shallowDatabase, nestedDatabase } = (0, _helpers.splitDatabaseByNesting)(storage.read());
    const nestedOrm = Object.keys(nestedDatabase).reduce((orm, key)=>{
        orm[key] = {
            create: (item)=>{
                const collection = storage.read(key);
                const newResourceId = (0, _helpers.createNewId)(collection);
                const newResource = {
                    ...item,
                    id: newResourceId
                };
                storage.write([
                    key,
                    collection.length
                ], newResource);
                return newResource;
            },
            update: (id, item)=>{
                const collection = storage.read(key);
                const currentResourceIndex = (0, _helpers.findIndexById)(collection, id);
                const currentResource = storage.read([
                    key,
                    currentResourceIndex
                ]);
                const updatedResource = {
                    ...currentResource,
                    ...item,
                    id
                };
                storage.write([
                    key,
                    currentResourceIndex
                ], updatedResource);
            },
            delete: (id)=>{
                const collection = storage.read(key);
                const currentResourceIndex = (0, _helpers.findIndexById)(collection, id);
                storage.delete([
                    key,
                    currentResourceIndex
                ]);
            },
            createMany (items) {
                items.forEach((item)=>this.create(item));
            },
            updateMany (ids, item) {
                ids.forEach((id)=>this.update(id, item));
                return ids.length;
            },
            deleteMany (ids) {
                ids.forEach((id)=>this.delete(id));
            },
            findById: (id)=>{
                const collection = storage.read(key);
                const currentResourceIndex = (0, _helpers.findIndexById)(collection, id);
                return storage.read([
                    key,
                    currentResourceIndex
                ]);
            },
            findMany: (filters)=>{
                const collection = storage.read(key);
                if (!filters) return collection;
                const flattenedFilters = (0, _flat.flatten)(filters);
                return collection.filter((resource)=>{
                    const flattenedResource = (0, _flat.flatten)(resource);
                    return Object.entries(flattenedFilters).every(([key, value])=>flattenedResource[key] === value);
                });
            },
            findFirst: (filters)=>{
                const collection = storage.read(key);
                if (!filters) return collection[0];
                const flattenedFilters = (0, _flat.flatten)(filters);
                return collection.find((resource)=>{
                    const flattenedResource = (0, _flat.flatten)(resource);
                    return Object.entries(flattenedFilters).every(([key, value])=>flattenedResource[key] === value);
                });
            },
            exists: (filters)=>{
                const collection = storage.read(key);
                const flattenedFilters = (0, _flat.flatten)(filters);
                return collection.some((resource)=>{
                    const flattenedResource = (0, _flat.flatten)(resource);
                    return Object.entries(flattenedFilters).every(([key, value])=>flattenedResource[key] === value);
                });
            },
            count: ()=>storage.read(key).length
        };
        orm[key].createMany = orm[key].createMany.bind(orm[key]);
        orm[key].updateMany = orm[key].updateMany.bind(orm[key]);
        orm[key].deleteMany = orm[key].deleteMany.bind(orm[key]);
        return orm;
    }, {});
    const shallowOrm = Object.keys(shallowDatabase).reduce((orm, key)=>{
        orm[key] = {
            get: ()=>storage.read(key),
            update: (data)=>{
                storage.write(key, data);
            }
        };
        return orm;
    }, {});
    return {
        ...nestedOrm,
        ...shallowOrm
    };
};
