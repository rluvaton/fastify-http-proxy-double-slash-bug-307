import Fastify from 'fastify';
import FastifyPluginHttpProxy from '@fastify/http-proxy';
import {after, before, describe, test} from "node:test";
import {deepStrictEqual} from "node:assert";

let remoteServer;
let proxy;

async function setup() {
    remoteServer = Fastify();

    remoteServer.all('*', async (req) => ({url: req.url}));

    await remoteServer.listen({host: 'localhost', port: 3333});

    proxy = Fastify();

    proxy.register(FastifyPluginHttpProxy, {
        upstream: 'http://localhost:3333',
    });

    await proxy.listen({host: 'localhost', port: 3334});
}

describe('run', () => {

    before(async () => {
        await setup();
    });

    test('should proxy with double slash at the beginning no matter what', async () => {
        const response = await fetch('http://localhost:3334//');

        const body = await response.json();
        deepStrictEqual({status: response.status, body}, {
            status: 200,
            body: {
                url: '//'
            }
        });
    });

    test('should proxy with double slash at the beginning with route after no matter what', async () => {
        const response = await fetch('http://localhost:3334//route');

        const body = await response.json();
        deepStrictEqual({status: response.status, body}, {
            status: 200,
            body: {
                url: '//route'
            }
        });
    });

    after(async () => {
        await Promise.all([remoteServer.close(), proxy.close()]);
    })

});
