"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createShallowDatabaseRoutes", {
    enumerable: true,
    get: function() {
        return createShallowDatabaseRoutes;
    }
});
const _filter = require("../filter/filter");
const _pagination = require("../pagination/pagination");
const _search = require("../search/search");
const _sort = require("../sort/sort");
const createShallowDatabaseRoutes = (router, database, storage)=>{
    Object.keys(database).forEach((key)=>{
        const path = `/${key}`;
        router.route(path).get((request, response)=>{
            let data = storage.read(key);
            if (!Array.isArray(data) || !request.query) {
                // ✅ important:
                // set 'Cache-Control' header for explicit browsers response revalidate
                // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
                response.set('Cache-control', 'no-cache');
                return response.json(data);
            }
            data = data.filter((element)=>typeof element === 'object' && element !== null);
            const { _page, _limit, _begin, _end, _sort: _sort1, _order, _q, ...filters } = request.query;
            if (Object.keys(filters).length) {
                data = (0, _filter.filter)(data, filters);
            }
            if (_q) {
                data = (0, _search.search)(data, request.query._q);
            }
            if (_sort1) {
                data = (0, _sort.sort)(data, request.query);
            }
            if (_begin || _end) {
                var _request_query__begin;
                data = data.slice((_request_query__begin = request.query._begin) !== null && _request_query__begin !== void 0 ? _request_query__begin : 0, request.query._end);
                response.set('X-Total-Count', data.length);
            }
            // ✅ important:
            // The pagination should be last because it changes the form of the response
            if (_page) {
                data = (0, _pagination.pagination)(data, request.query);
                if (data._link) {
                    const links = {};
                    const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;
                    if (data._link.first) {
                        links.first = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.first}`);
                    }
                    if (data._link.prev) {
                        links.prev = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.prev}`);
                    }
                    if (data._link.next) {
                        links.next = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.next}`);
                    }
                    if (data._link.last) {
                        links.last = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.last}`);
                    }
                    data._link = {
                        ...data._link,
                        ...links
                    };
                    response.links(links);
                }
            }
            // ✅ important:
            // set 'Cache-Control' header for explicit browsers response revalidate
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
            response.set('Cache-control', 'no-cache');
            response.json(data);
        });
        router.route(path).post((request, response)=>{
            storage.write(key, request.body);
            response.set('Location', request.url);
            response.status(201).json(request.body);
        });
        router.route(path).put((request, response)=>{
            storage.write(key, request.body);
            response.json(request.body);
        });
        router.route(path).patch((request, response)=>{
            const currentResource = storage.read(key);
            const updatedResource = {
                ...currentResource,
                ...request.body
            };
            storage.write(key, updatedResource);
            response.json(updatedResource);
        });
    });
    return router;
};
