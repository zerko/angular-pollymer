'use strict';

describe('Pollymer', function () {

    // some boilerplate
    function req(request, method, url) {
        var promise = request.start(method, url);
        $rootScope.$apply();
        $timeout.flush();
        return promise;
    }

    // load the service's module
    beforeEach(module('pollymer'));

    // instantiate service and mocks
    var Pollymer, $httpBackend, $timeout, $http, $rootScope;
    beforeEach(inject(function (_Pollymer_, _$httpBackend_, _$timeout_, _$http_, _$rootScope_) {
        Pollymer = _Pollymer_;
        $httpBackend = _$httpBackend_;
        $timeout = _$timeout_;
        $http = _$http_;
        $rootScope = _$rootScope_;
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();

    });

    it('can make GET requests', function () {
        var request = new Pollymer();
        $httpBackend.expectGET('/foo').respond(200, 'Ok');
        req(request, 'GET', '/foo');
        expect($http.pendingRequests.length).toBe(1);
        expect($http.pendingRequests[0].method).toBe('GET');
        expect($http.pendingRequests[0].url).toBe('/foo');
    });

    it('can deliver data via promise', function () {
        var request = new Pollymer();
        $httpBackend.expectGET('/foo').respond(200, 'Ok');
        var promise = req(request, 'GET', '/foo');
        expect($http.pendingRequests.length).toBe(1);
        //! FIXME spy if it was called
        promise.success(function (data, status) {
            expect(data).toBe('Ok');
            expect(status).toBe(200);
        });
        $httpBackend.flush();
    });

    it('can deliver errors via promise', function () {
        var request = new Pollymer();
        $httpBackend.expectGET('/foo').respond(500, 'error');
        var promise = req(request, 'GET', '/foo');
        //! FIXME spy if it was called
        promise.error(function (data, status) {
            expect(data).toBe('error');
            expect(status).toBe(500);
        });
        $httpBackend.flush();
    });

    it('can retry requests manually', function () {
        var request = new Pollymer();
        $httpBackend.expectGET('/foo').respond(500);
        var promise = req(request, 'GET', '/foo');
        $httpBackend.flush();
        request.retry();
        $httpBackend.expectGET('/foo').respond(200);
        $timeout.flush();
        promise.success(function (data, status) {
            expect(status).toBe(200);
        });
        $httpBackend.flush();
    });


    it('can retry requests automatically', function () {
        var request = new Pollymer();
        request.maxTries = 2;
        $httpBackend.expectGET('/foo').respond(500);
        var promise = req(request, 'GET', '/foo');
        $httpBackend.flush();
        $httpBackend.expectGET('/foo').respond(200);
        $timeout.flush();
        promise.success(function (data, status) {
            expect(status).toBe(200);
        });
    });

    it('can retry requests but no more times than maxTries', function () {
        var request = new Pollymer();
        request.maxTries = 2;
        $httpBackend.expectGET('/foo').respond(500);
        var promise = req(request, 'GET', '/foo');
        $httpBackend.flush();
        $httpBackend.expectGET('/foo').respond(500);
        $timeout.flush();
        promise.error(function (data, status) {
            expect(status).toBe(500);
        });
        $httpBackend.flush();
    });

});


'use strict';

describe('Url parameter', function () {
    function req(request, method, url) {
        var promise = request.start(method, url);
        $rootScope.$apply();
        $timeout.flush();
        return promise;
    }

    // load the service's module
    beforeEach(module('pollymer'));

    // instantiate service and mocks
    var Pollymer, $httpBackend, $timeout, $http, $rootScope, $q;
    beforeEach(inject(function (_Pollymer_, _$httpBackend_, _$timeout_, _$http_, _$rootScope_, _$q_) {
        Pollymer = _Pollymer_;
        $httpBackend = _$httpBackend_;
        $timeout = _$timeout_;
        $http = _$http_;
        $rootScope = _$rootScope_;
        $q = _$q_;
    }));


    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();

    });

    it('can be function', function () {
        var request = new Pollymer();
        $httpBackend.expectGET('/bar').respond(200, 'Ok');
        req(request, 'GET', function () {
            return '/bar'
        });
        expect($http.pendingRequests.length).toBe(1);
        expect($http.pendingRequests[0].method).toBe('GET');
        expect($http.pendingRequests[0].url).toBe('/bar');
    });


    it('can be promise', function () {
        var request = new Pollymer();
        var deferred = $q.defer()
        var promise = deferred.promise;
        $httpBackend.expectGET('/bar').respond(200, 'Ok');
        deferred.resolve('/bar');
        req(request, 'GET', promise);
        expect($http.pendingRequests.length).toBe(1);
        expect($http.pendingRequests[0].method).toBe('GET');
        expect($http.pendingRequests[0].url).toBe('/bar');
    });


    it('does nothing when it is falsy', function () {
        var request = new Pollymer();
        request.start('GET', false);
        expect($http.pendingRequests.length).toBe(0);
    });

});



