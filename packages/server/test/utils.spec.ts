import { IncomingMessage } from 'http';
import Stream from 'stream';
import Koa from 'koa';
import { describe, expect, it } from '@jest/globals';
import * as DefaultFetchAPI from '@whatwg-node/fetch';
import { isolateObject, normalizeNodeRequest } from '../src/utils';

describe('isolateObject', () => {
  describe('Object.create', () => {
    it('property assignments', () => {
      const origin = isolateObject({});
      const a = Object.create(origin);
      const b = Object.create(origin);
      a.a = 1;
      expect(b.a).toEqual(undefined);
    });
    it('property assignments with defineProperty', () => {
      const origin = isolateObject({});
      const a = Object.create(origin);
      const b = Object.create(origin);
      Object.defineProperty(a, 'a', { value: 1 });
      expect(b.a).toEqual(undefined);
    });
    it('property deletions', () => {
      const origin = isolateObject({});
      const a = Object.create(origin);
      const b = Object.create(origin);
      b.a = 2;
      a.a = 1;
      delete a.a;
      expect(b.a).toEqual(2);
    });
    it('ownKeys', () => {
      const origin = isolateObject({});
      const a = Object.create(origin);
      const b = Object.create(origin);
      a.a = 1;
      expect(Object.keys(a)).toEqual(['a']);
      expect(Object.keys(b)).toEqual([]);
    });
    it('hasOwnProperty', () => {
      const origin = isolateObject({});
      const a = Object.create(origin);
      const b = Object.create(origin);
      a.a = 1;
      expect(a.hasOwnProperty('a')).toEqual(true);
      expect(b.hasOwnProperty('a')).toEqual(false);
    });
    it('getOwnPropertyDescriptor', () => {
      const origin = isolateObject({});
      const a = Object.create(origin);
      const b = Object.create(origin);
      a.a = 1;
      const desc = Object.getOwnPropertyDescriptor(a, 'a');
      expect(desc?.value).toEqual(1);
      expect(Object.getOwnPropertyDescriptor(b, 'a')).toEqual(undefined);
    });
  });

  describe('normalizeRequest', () => {
    it('should return a normalized request object for Koa Request', () => {
      const app = new Koa();
      const socket = new Stream.Duplex();

      const incomingMessage = new IncomingMessage(new Stream.Readable());
      incomingMessage.url = 'http://localhost:8080';
      incomingMessage.method = 'POST';
      incomingMessage.headers = {
        'Content-Type': 'application/json',
        'x-test-header': 'test1',
      };
      const res = Object.assign({ _headers: {}, socket }, Stream.Writable.prototype);

      const koaContext = app.createContext(incomingMessage, res);
      const koaRequest = koaContext.request;

      // passes
      expect(koaRequest.header['x-test-header']).toEqual('test1');

      const normalizedRequest = normalizeNodeRequest(koaRequest, DefaultFetchAPI);
      expect(normalizedRequest.headers.get('x-test-header')).toEqual('test1');

      // fails
      // @ts-expect-error -- header is not defined here in the types
      expect(normalizedRequest.header['x-test-header']).toEqual('test1');
    });
  });
});
