'use strict';

const fixtures     = require('haraka-test-fixtures');

function _set_up_redis (done) {

    this.plugin = new fixtures.plugin('index');
    this.plugin.register();

    done();
}

function retry (options) {
    if (options.error) {
        console.error(options.error);
    }
    return undefined;
}

exports.redis = {
    setUp : _set_up_redis,
    'loads' : function (test) {
        test.expect(1);
        test.equal(this.plugin.name, 'index');
        test.done();
    },
    'config defaults' : function (test) {
        test.expect(2);
        test.equal(this.plugin.redisCfg.server.host, '127.0.0.1');
        test.equal(this.plugin.redisCfg.server.port, 6379);
        test.done();
    },
    'connects' : function (test) {
        test.expect(1);
        const redis = this.plugin.get_redis_client({
            host: this.plugin.redisCfg.server.host,
            port: this.plugin.redisCfg.server.port,
            retry_strategy: retry,
        },
        function () {
            test.ok(redis.status === 'ready');
            test.done();
        });
    },
    'populates plugin.cfg.redis when asked' : function (test) {
        test.expect(2);
        test.equal(this.plugin.cfg, undefined);
        this.plugin.merge_redis_ini();
        test.deepEqual(this.plugin.cfg.redis, { host: '127.0.0.1', port: '6379', db: undefined });
        test.done();
    },
    'connects to a different redis db' : function (test) {
        test.expect(2);
        this.plugin.merge_redis_ini();
        this.plugin.cfg.redis.db = 2;
        this.plugin.cfg.redis.retry_strategy = retry;
        const client = this.plugin.get_redis_client(this.plugin.cfg.redis, function () {
            test.expect(2);
            test.equal(client.status, 'ready');
            test.equal(client.condition.select, 2);
            test.done();
        });
    }
};
