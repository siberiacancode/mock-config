import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';

import type { ShallowDatabase } from '@/utils/types';

import { MemoryStorage } from '../../storages';
import { createShallowDatabaseRoutes } from './createShallowDatabaseRoutes';

describe('createShallowDatabaseRoutes', () => {
  const createShallowDatabase = () => ({
    users: [
      { name: 'John Doe', age: 25, address: { city: 'Novosibirsk' }, hobbies: ['music', 'sport'] },
      { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
    ],
    john: { name: 'John Doe', age: 25 },
    jane: { name: 'Jane Smith', age: 30 }
  });

  const createServer = (shallowDatabase: ShallowDatabase) => {
    const server = express();
    const routerBase = express.Router();
    const storage = new MemoryStorage(shallowDatabase);

    const routerWithRoutesForShallowDatabase = createShallowDatabaseRoutes(
      routerBase,
      shallowDatabase,
      storage
    );

    server.use(bodyParser.json());
    server.use(bodyParser.text());
    server.use('/', routerWithRoutesForShallowDatabase);

    return server;
  };

  describe('createShallowDatabaseRoutes: GET method', () => {
    const shallowDatabase = createShallowDatabase();
    const server = createServer(shallowDatabase);

    it('Should return correct data for valid key', async () => {
      const response = await request(server).get('/john');

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual(shallowDatabase.john);
    });

    it('Should return correct Cache-Control header for valid key', async () => {
      const response = await request(server).get('/john');

      expect(response.headers['cache-control']).toBe('no-cache');
    });
  });

  describe('createShallowDatabaseRoutes: POST method', () => {
    let shallowDatabase: ReturnType<typeof createShallowDatabase>;
    let server: Express;
    beforeEach(() => {
      shallowDatabase = createShallowDatabase();
      server = createServer(shallowDatabase);
    });

    it('Should return correct data for valid key and successfully update database', async () => {
      const newJohnInfo = { age: 26, standName: 'The World' };

      const postResponse = await request(server).post('/john').send(newJohnInfo);
      expect(postResponse.statusCode).toBe(201);
      expect(postResponse.body).toStrictEqual(newJohnInfo);

      const getResponse = await request(server).get('/john');
      expect(getResponse.body).toStrictEqual(newJohnInfo);
    });

    it('Should return correct Location header for valid key', async () => {
      const response = await request(server).post('/john').send(undefined);

      expect(response.headers.location).toBe('/john');
    });
  });

  describe('createShallowDatabaseRoutes: PUT method', () => {
    let shallowDatabase: ReturnType<typeof createShallowDatabase>;
    let server: Express;
    beforeEach(() => {
      shallowDatabase = createShallowDatabase();
      server = createServer(shallowDatabase);
    });

    it('Should return correct data for valid key and successfully update database', async () => {
      const newJohnInfo = { age: 26, standName: 'The World' };

      const putResponse = await request(server).put('/john').send(newJohnInfo);
      expect(putResponse.statusCode).toBe(200);
      expect(putResponse.body).toStrictEqual(newJohnInfo);

      const getResponse = await request(server).get('/john');
      expect(getResponse.body).toStrictEqual(newJohnInfo);
    });
  });

  describe('createShallowDatabaseRoutes: PATCH method', () => {
    let shallowDatabase: ReturnType<typeof createShallowDatabase>;
    let server: Express;
    beforeEach(() => {
      shallowDatabase = createShallowDatabase();
      server = createServer(shallowDatabase);
    });

    it('Should return correct data for valid key and successfully update database', async () => {
      const newJohnInfo = { age: 26, standName: 'The World' };

      const patchResponse = await request(server).patch('/john').send(newJohnInfo);
      expect(patchResponse.statusCode).toBe(200);
      expect(patchResponse.body).toStrictEqual({ ...shallowDatabase.john, ...newJohnInfo });

      const getResponse = await request(server).get('/john');
      expect(getResponse.body).toStrictEqual({ ...shallowDatabase.john, ...newJohnInfo });
    });
  });

  describe('createShallowDatabaseRoutes: database functions', () => {
    const notArrayShallowDatabaseValues = ['string', true, 3000, null, {}];

    notArrayShallowDatabaseValues.forEach((notArrayShallowDatabaseValue) => {
      it(`Should return unchanged result when data type is ${typeof notArrayShallowDatabaseValue}`, async () => {
        const server = createServer({ users: notArrayShallowDatabaseValue });

        const response = await request(server).get(
          '/users?name=users_page=1&_limit=1_begin=1&_end=1?_sort=users_q=users'
        );

        expect(response.body).toStrictEqual(notArrayShallowDatabaseValue);
      });
    });
  });

  describe('createShallowDatabaseRoutes: filter function', () => {
    const shallowDatabase = createShallowDatabase();
    const server = createServer(shallowDatabase);

    it('Should return filtered array by query', async () => {
      const response = await request(server).get('/users?name=John Doe');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        }
      ]);
    });

    it('Should return filtered array by identical queries names', async () => {
      const response = await request(server).get('/users?age=25&age=30');

      expect(response.body).toStrictEqual(shallowDatabase.users);
    });

    it('Should return filtered array by nested query', async () => {
      const response = await request(server).get('/users?address.city=Novosibirsk');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        }
      ]);
    });

    it('Should return filtered array by neq operator', async () => {
      const response = await request(server).get('/users?age_neq=25');

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });

    it('Should return filtered array by gt operator', async () => {
      const response = await request(server).get('/users?age_gt=25');

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });

    it('Should return filtered array by gte operator', async () => {
      const response = await request(server).get('/users?age_gte=25');

      expect(response.body).toStrictEqual(shallowDatabase.users);
    });

    it('Should return filtered array by lt operator', async () => {
      const response = await request(server).get('/users?age_lt=30');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        }
      ]);
    });

    it('Should return filtered array by lte operator', async () => {
      const response = await request(server).get('/users?age_lte=30');

      expect(response.body).toStrictEqual(shallowDatabase.users);
    });

    it('Should return filtered array by cn operator', async () => {
      const response = await request(server).get('/users?name_cn=Jane');

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });

    it('Should return filtered array by ncn operator', async () => {
      const response = await request(server).get('/users?name_ncn=Jane');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        }
      ]);
    });

    it('Should return filtered array by sw operator', async () => {
      const response = await request(server).get('/users?name_sw=J');

      expect(response.body).toStrictEqual(shallowDatabase.users);
    });

    it('Should return filtered array by nsw operator', async () => {
      const response = await request(server).get('/users?name_nsw=J');

      expect(response.body).toStrictEqual([]);
    });

    it('Should return filtered array by ew operator', async () => {
      const response = await request(server).get('/users?name_ew=a');

      expect(response.body).toStrictEqual([]);
    });

    it('Should return filtered array by new operator', async () => {
      const response = await request(server).get('/users?name_new=a=J');

      expect(response.body).toStrictEqual(shallowDatabase.users);
    });

    it('Should return filtered array by some operator', async () => {
      const response = await request(server).get('/users?hobbies_some=games');

      expect(response.body).toStrictEqual([
        {
          name: 'Jane Smith',
          age: 30,
          address: { city: 'Tomsk' },
          hobbies: ['sport', 'games']
        }
      ]);
    });
  });

  describe('createShallowDatabaseRoutes: pagination function', () => {
    const shallowDatabase = createShallowDatabase();
    const server = createServer(shallowDatabase);

    it('Should return paginationed data by query', async () => {
      const response = await request(server).get('/users?_page=1');

      expect(response.body.results).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        },
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
      expect(response.body._link).toEqual(
        expect.objectContaining({
          count: 2,
          pages: 1,
          current: 1,
          next: null,
          prev: null
        })
      );
      expect(response.body._link.first).toContain('/users?_page=1');
      expect(response.body._link.last).toContain('/users?_page=1');
    });

    it('Should return paginationed data by query with limit', async () => {
      const response = await request(server).get('/users?_page=1&_limit=1');

      expect(response.body.results).toStrictEqual([
        { name: 'John Doe', age: 25, address: { city: 'Novosibirsk' }, hobbies: ['music', 'sport'] }
      ]);
      expect(response.body._link).toEqual(
        expect.objectContaining({
          count: 2,
          pages: 2,
          current: 1,
          prev: null
        })
      );
      expect(response.body._link.first).toContain('/users?_page=1&_limit=1');
      expect(response.body._link.last).toContain('/users?_page=2&_limit=1');
      expect(response.body._link.next).toContain('/users?_page=2&_limit=1');
    });

    it('Should return valid _link for paginationed data', async () => {
      const linkHeaderRegexp = /<([^>]+)>;\s*rel="([^"]+)"/g;
      const firstResponse = await request(server).get('/users?_page=1&_limit=1');

      const firstResponseLinks = firstResponse.headers.link.match(linkHeaderRegexp);
      expect(firstResponse.headers.link).toMatch(linkHeaderRegexp);

      if (!firstResponseLinks) throw new Error('Link header not found');

      expect(firstResponseLinks.length).toEqual(3);

      const [firstNextLink, firstPrevLink, firstLastLink] = firstResponseLinks;
      expect(firstNextLink).toContain('/users?_page=1&_limit=1>; rel="first"');
      expect(firstPrevLink).toContain('/users?_page=2&_limit=1>; rel="next"');
      expect(firstLastLink).toContain('/users?_page=2&_limit=1>; rel="last"');

      expect(firstResponse.body.results).toStrictEqual([
        { name: 'John Doe', age: 25, address: { city: 'Novosibirsk' }, hobbies: ['music', 'sport'] }
      ]);
      expect(firstResponse.body._link).toEqual(
        expect.objectContaining({
          count: 2,
          pages: 2,
          current: 1,
          prev: null
        })
      );
      expect(firstResponse.body._link.first).toContain('/users?_page=1&_limit=1');
      expect(firstResponse.body._link.last).toContain('/users?_page=2&_limit=1');
      expect(firstResponse.body._link.next).toContain('/users?_page=2&_limit=1');

      const secondResponse = await request(server).get('/users?_page=2&_limit=1');

      const secondResponseLinks = firstResponse.headers.link.match(linkHeaderRegexp);
      expect(secondResponse.headers.link).toMatch(linkHeaderRegexp);

      if (!secondResponseLinks) throw new Error('Link header not found');

      expect(secondResponseLinks.length).toEqual(3);

      const [secondNextLink, secondPrevLink, secondLastLink] = secondResponseLinks;
      expect(secondNextLink).toContain('/users?_page=1&_limit=1>; rel="first"');
      expect(secondPrevLink).toContain('/users?_page=2&_limit=1>; rel="next"');
      expect(secondLastLink).toContain('/users?_page=2&_limit=1>; rel="last"');

      expect(secondResponse.body.results).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
      expect(secondResponse.body._link).toEqual(
        expect.objectContaining({
          count: 2,
          pages: 2,
          current: 2,
          next: null
        })
      );
      expect(secondResponse.body._link.first).toContain('/users?_page=1&_limit=1');
      expect(secondResponse.body._link.last).toContain('/users?_page=2&_limit=1');
      expect(secondResponse.body._link.prev).toContain('/users?_page=1&_limit=1');
    });

    it('Should return valid data by invalid pagination data', async () => {
      const response = await request(server).get('/users?_page=2');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        },
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });
  });

  describe('createShallowDatabaseRoutes: slice function', () => {
    const shallowDatabase = createShallowDatabase();
    const server = createServer(shallowDatabase);

    it('Should return sliced array by _begin query', async () => {
      const response = await request(server).get('/users?_begin=1');

      expect(response.body).toStrictEqual(shallowDatabase.users.slice(1));
    });

    it('Should return sliced array by _end query', async () => {
      const response = await request(server).get('/users?_end=1');

      expect(response.body).toStrictEqual(shallowDatabase.users.slice(0, 1));
    });

    it('Should return sliced array by _begin and _end query', async () => {
      const response = await request(server).get('/users?_begin=0&_end=2');

      expect(response.body).toStrictEqual(shallowDatabase.users.slice(0, 2));
    });
  });

  describe('createShallowDatabaseRoutes: sort function', () => {
    const shallowDatabase = createShallowDatabase();
    const server = createServer({
      users: [
        ...shallowDatabase.users,
        { name: 'Will Smith', age: 27, address: { city: 'Moscow' }, hobbies: ['music'] }
      ]
    });

    it('Should return sorted data by query', async () => {
      const response = await request(server).get('/users?_sort=age');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        },
        { name: 'Will Smith', age: 27, address: { city: 'Moscow' }, hobbies: ['music'] },
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });

    it('Should return sorted data by query with order', async () => {
      const response = await request(server).get('/users?_sort=age&_order=desc');

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] },
        { name: 'Will Smith', age: 27, address: { city: 'Moscow' }, hobbies: ['music'] },
        { name: 'John Doe', age: 25, address: { city: 'Novosibirsk' }, hobbies: ['music', 'sport'] }
      ]);
    });

    it('Should return sorted data by multiple query', async () => {
      const response = await request(server).get(
        '/users?_sort=name&_order=asc&_sort=age&_order=desc'
      );

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] },
        { name: 'Will Smith', age: 27, address: { city: 'Moscow' }, hobbies: ['music'] },
        { name: 'John Doe', age: 25, address: { city: 'Novosibirsk' }, hobbies: ['music', 'sport'] }
      ]);
    });

    it('Should return filtered array by nested query', async () => {
      const response = await request(server).get('/users?_sort=address.city&_order=desc');

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] },
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        },
        { name: 'Will Smith', age: 27, address: { city: 'Moscow' }, hobbies: ['music'] }
      ]);
    });
  });

  describe('createNestedDatabaseRoutes: search function', () => {
    const shallowDatabase = createShallowDatabase();
    const server = createServer(shallowDatabase);

    const correctSearchValues = ['string', true, 3000, null];

    correctSearchValues.forEach((correctSearchValue) => {
      it(`Should search data by "${correctSearchValue}" query with type ${
        correctSearchValue !== null ? typeof correctSearchValue : 'null'
      }`, async () => {
        const server = createServer({ users: [{ data: correctSearchValue }] });

        const response = await request(server).get(`/users?_q=${correctSearchValue}`);

        expect(response.body).toStrictEqual([{ data: correctSearchValue }]);
      });
    });

    it('Should filter data by query when nested text', async () => {
      const response = await request(server).get('/users?_q=Tomsk');

      expect(response.body).toStrictEqual([
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });

    it('Should filter data by multiple query', async () => {
      const response = await request(server).get('/users?_q=Tomsk&_q=Novosibirsk');

      expect(response.body).toStrictEqual([
        {
          name: 'John Doe',
          age: 25,
          address: { city: 'Novosibirsk' },
          hobbies: ['music', 'sport']
        },
        { name: 'Jane Smith', age: 30, address: { city: 'Tomsk' }, hobbies: ['sport', 'games'] }
      ]);
    });
  });
});
