(function () {
    "use strict";
    angular.module('pollymer', [])
        .factory('Pollymer', function ($http, $timeout, $log, $q) {
            var Request = function () {
                this._tries = 0;
                this._delayNext = false;
                this._retryTime = 0;
                this._config = {}

                this.maxTries = 1;
                this.maxDelay = 1000;
                this.recurring = false;
//        this.withCredentials = false;
                this.timeout = 60000
            };
            Request.prototype.start = function (method, url) {
                var that = this;
                this.deferred = $q.defer();

                $q.when(url).then(
                    function (url) {
                        if (angular.isFunction(url))
                            url = url();
                        if(!url)
                            return;

                        that._config = {
                            method: method,
                            url: url,
                            timeout: that.timeout

                        };
                        that._start();

                    }
                )

                var promise = this.deferred.promise;
                promise.success = function (fn) {
                    promise.then(function (res) {
                        fn(res.data, res.status);
                    });
                    return promise;
                };

                promise.error = function (fn) {
                    promise.then(null, function (res) {
                        fn(res.data, res.status);
                    });
                    return promise;
                };

                return this.deferred.promise;
            };

            Request.prototype._start = function () {
                this._tries = 0;

                var delayTime;
                if (this._delayNext) {
                    this._delayNext = false;
                    delayTime = Math.floor(Math.random() * this.maxDelay);
                    $log.log("pollymer: polling again in " + delayTime + "ms");
                } else {
                    delayTime = 0; // always queue the call, to prevent browser "busy"
                }

                this._initiate(delayTime);
            };
            Request.prototype._initiate = function (delayMsecs) {
                var self = this;
                $timeout(function () {
                    self._startConnect()
                }, delayMsecs, false);
            };

            Request.prototype._startConnect = function () {
                var self = this;

                this._tries++;
                $http(this._config).then(
                    function success(data) {
                        if (data.status > 0) {
                          self._delayNext = true;
                            self.deferred.resolve(data);
                            if (self.recurring && data.status >= 200 && data.status < 300) {
                                self._start();
                            }
                        } else {
                            self.deferred.reject(data)
                        }
                    },
                    function error(data) {
                        if ((data.status == 0 || (data.status >= 500 && data.status < 600)) &&
                            (self.maxTries == -1 || self._tries < self.maxTries))
                            return self._retry();
                        self.deferred.reject(data)

                    });

            };

            Request.prototype.retry = function () {
                if (this._tries == 0) {
                    $log.error("pollymer: retry() called on a Request object that has never been started.");
                    return;
                }
                //! Fixme
                //if (this._timer != null) {
                //    consoleError("pollymer: retry() called on a Request object that is currently running.");
                //    return;
                //}
                this._retry();
            };

            Request.prototype._retry = function () {
                if (this._tries === 1) {
                    this._retryTime = 1;
                } else if (this._tries < 8) {
                    this._retryTime = this._retryTime * 2;
                }

                var delayTime = this._retryTime * 1000;
                delayTime += Math.floor(Math.random() * this.maxDelay);
                $log.log("pollymer: trying again in " + delayTime + "ms");

                this._initiate(delayTime);
            };


            return Request;
        });
})();
