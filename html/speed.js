(function () {
  Promise.create = function (f) {
    return new Promise(f);
  }
  Promise.setTimeout = function PromiseSetTimeout(timer) {
    return new Promise(function (r, x) {
      setTimeout(r.bind(null, true), timer);
    });
  };
  Promise.series = function PromiseSeries(promises) {
    function interator(v, i, arr, varr, gr, gx) {
      if (i == arr.length)
        return gr(varr);
      var p;
      if (typeof v == 'function') {
        p = (new Promise(v));
      } else {
        p = Promise.resolve(v);
      }

      p
        .then(assignTo(varr, i))
        .then(interator.bind(this, arr[i + 1], i + 1, arr, varr, gr, gx))
        .catch(gx);
    };

    return new Promise(function (resolve, reject) {
      var si = promises.length - 1;
      var varr = new Array(promises.length);
      interator(promises[0], 0, promises, varr, resolve, reject);
    });
  };

  //Promise.series([function(r) {r('u')}, 1,2,3,4]).then(console.log);

  Promise.prototype.branch = function PromisePassthru(calls) {
    return this.then(function (v) {
      calls.forEach(function (c) {
        setTimeout(c.bind(null, v), 0)
      });
      return v;
    })
  }

  //Promise.resolve(3000).branch([console.log, console.error, function(v) { setTimeout(console.log.bind(null, 'delayed'), v); }]).then(console.log.bind(null, "promise value"));

  function assignTo(o, k) {
    return function (v) {
      o[k] = v;
      return v;
    };
  }
  function assignInline(o, k, v) {
    return function (pv) {
      o[k] = v;
      return pv;
    };
  }

  /*var tp = Promise.defered();
  tp.then(console.log);
  setTimeout(function() {tp.$resolve(1111); }, 1000);*/

  function arrayFlatten() {
    'use strict';
    var args = Array.prototype.slice.call(arguments, 0);
    return args.reduce(function (ac, c, ci) {
      var from;
      if (Array.isArray(c))
        from = arrayFlatten.apply(null, c);
      else
        from = [c];

      return ac.concat(from);
    }, []);
  }

  function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  function formatBytes(bytes, total, decimals) {
    if (bytes === 0) return 0;

    let k = 1024;
    let dm = decimals < 0 ? 0 : decimals;
    let colors = [ '#ff2400', '#e81d1d', '#e8b71d', '#e3e81d', '#1de840', '#1ddde8', '#2b1de8', '#dd00f3', '#dd00f3' ];

    let random = getRandomArbitrary(0, colors.length);
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    let resultsBytes = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))/* + ' ' + sizes[i]*/;

    console.clear()
    console.log(
      '%cSai fora menor!!',
      `
        text-align:center;
        color:${colors[random]};
        font-family:"Fira Code";
        font-size:2rem;
        font-weight:bold;
        align-items:center;
        display:flex;
        flex-direction:row;
        flex-wrap:wrap;
        justify-content:center;`
    )
    return resultsBytes;
  }

  function lessThan(number) {
    if(number < 10) return "0"+number;
    else return number;
  }

  function startTime() {
    const today = new Date();
    const date = today.getFullYear()+'/'+lessThan(today.getMonth()+1)+'/'+lessThan(today.getDate());
    const time = lessThan(today.getHours())+":"+lessThan(today.getMinutes())+":"+lessThan(today.getSeconds())+" "+lessThan(today.getMilliseconds());

    return date + ' ' + time;
  }
  //console.log(arrayFlatten([1,2,3,4,[1,2,3,4,5,[8,9,0]]]))

  //
  // end pre libs
  //
  var $app = angular.module('app', []);
  $app.run(function ($rootScope) {
    $rootScope.$conf = {};
    var confLoaded = new Promise(function (resolve, reject) {
      $.get('./conf', resolve).fail(reject);
    });
    confLoaded.then(assignTo($rootScope.$conf, 'limits'));
    $rootScope.$on('uiupdate', $rootScope.$applyAsync.bind($rootScope));
    $rootScope.$on('speedupdate', $rootScope.$applyAsync.bind($rootScope, null));

    $rootScope.$loadedP = Promise.all([confLoaded]);
    $rootScope.$loadedP.then(assignInline($rootScope, '$loaded', true)).then($rootScope.$emit.bind($rootScope, 'uiupdate'));

    //window.c = confLoaded;
  });
  $app.filter('orderObjectBy', function () {
    return function (items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function (item) {
        filtered.push(item);
      });
      filtered.sort(function (a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if (reverse) filtered.reverse();
      return filtered;
    };
  });

  $app.factory('$conf', function () {
    return new Promise(function (resolve, reject) {
      $.get('./conf', function (d) {
        resolve({ limits: d });
      }).fail(reject);
    });
  });

  $app.controller('all', function ($rootScope, $scope, $conf) {
    function updateui(r) {
      try {
      } catch (e) { }
      $rootScope.$applyAsync();
      return r;
    };

    function nullfilter(v) {
      return v != null;
    }

    function moveCurrent2Result(d) {
      $scope.results = $scope.results.concat(flattenResults($scope.current));
      return d;
    }

    function resetCurrent(d) {
      delete $scope.current;
      $scope.current = {};
      return d;
    }

    $scope.results = [];

    function flattenResults(o) {
      var ks = Object.keys(o.all);
      var l = ks.map(function (k) {
        delete o.all[k].$$hashKey;
        return o.all[k];
      });
      return l.filter(nullfilter);
    }

    $scope.current = {};
    $rootScope.$on('speedupdate', function (e, r) {
      var k = ({ up: "upload", down: "download" })[r.dir];
      $scope.current[k][r.dir + r.size + r.start] = r;
      $scope.current.all[r.dir + r.size + r.start] = r;
    })
    $scope.$startDownload = function () {
      if (!!$scope.current.all)
        return;
      $scope.current = { download: {}, all: {} };
      $conf.then(function ($conf) {
        downloadTestPanel($rootScope, $conf)
          .then(moveCurrent2Result)
          .then(resetCurrent)
          .then(updateui)
          .catch(moveCurrent2Result)
          .catch(resetCurrent)
          .catch(updateui);
      })
    };

    $scope.$startUpload = function () {
      if (!!$scope.current.all)
        return;
      $scope.current = { upload: {}, all: {} };
      return uploadTestPanel($rootScope)
        .then(moveCurrent2Result)
        .then(resetCurrent)
        .then(updateui)
        .catch(moveCurrent2Result)
        .catch(resetCurrent)
        .catch(updateui);
    };

    $scope.$startBoth = function () {
      if (!!$scope.current.all)
        return;
      $scope.current = { upload: {}, download: {}, all: {} };
      var dl = downloadTestPanel($rootScope);

      dl.catch(moveCurrent2Result)
        .catch(resetCurrent)
        .catch(updateui);
      dl.then(updateui).then(function () {
        return uploadTestPanel($rootScope)
          .then(moveCurrent2Result)
          .then(resetCurrent)
          .then(updateui)
          .catch(moveCurrent2Result)
          .catch(resetCurrent)
          .catch(updateui)
      });
    };

    $scope.$startDownloadStress = function () {
      $scope.current = { download: {}, all: {} };
      downloadStressTest($rootScope).then(function (res) {
        $scope.results = $scope.results.concat(flattenResults($scope.current));
        delete $scope.current;
        $scope.current = {};
        return res;
      }).then(updateui);
    };

    $scope.$startUploadStress = function () {
      $scope.current = { upload: {}, all: {} };
      uploadStressTest($rootScope).then(function (res) {
        $scope.results = $scope.results.concat(flattenResults($scope.current));
        delete $scope.current;
        $scope.current = {};
        return res;
      }).then(updateui);
    };

    $scope.$downloadCSV = function () {
      console.log($scope.results);
      var csvopts = [
        { k: 'dir', l: 'Direction' },
        { k: 'size', l: 'Size' },
        { k: 'dl', l: 'Bytes Downloaded' },
        { k: 'percent', l: 'Percent Completed' },
        { k: 'time', l: 'Time (sec)' },
        { k: 'start', l: 'Timestamp' },
        { k: 'speed.bps', l: 'bps' },
        { k: 'speed.kbps', l: 'Kbps' },
        { k: 'speed.mbps', l: 'Mbps' },
        { k: 'speed.gbps', l: 'Gbps' },
        'bitrate',
        'bittype'
      ];
      var csv = (json2csv($scope.results, csvopts));
      var f = new Blob([csv], { type: 'text/csv' });

      var dl = $('<a />');
      dl.attr('download', "speedtest_results.csv");
      var burl = URL.createObjectURL(f);
      dl.attr('href', burl);
      dl[0].click();
      window.URL.revokeObjectURL(burl);
    };


    $scope.$stopTests = function () {
      $rootScope.$testxhr.$st_abort();
    }

    $scope.$clearResults = function () {
      if (!!$scope.current.all)
        return;
      $scope.results = [];
      updateui();
    };
  })

  function downloadStressTest($rootScope, $conf) {
    var confcopy = _.cloneDeep($conf || $rootScope.$conf);
    confcopy.state || (confcopy.state = {});
    _.defaults(confcopy.state, {
      lastbitrate: 0,
      stop: false
    });
    return new Promise(function (resolve, reject) {
      if (!!confcopy.state.stop)
        return resolve();

      setTimeout(function () {
        downloadTestPanel($rootScope, confcopy).then(function (res) {

          var p = _.sortBy(res, 'speed.bps')
          _.reverse(p);
          p = _.slice(p, 0, 4);
          var max = _.maxBy(p, 'speed.bps');
          var min = _.minBy(p, 'speed.bps');
          if ((min.speed.bps / max.speed.bps) < 0.9) {
            confcopy.limits.downloadStartSize = _.maxBy(p, 'size').size;
            confcopy.limits.downloadSizeModifier = 1.1;
            downloadStressTest($rootScope, confcopy).then(resolve);
          } else {
            confcopy.state.stop = true;
            resolve();
          }

        }).catch(reject);
      }, 1);
    });

  } // end download stress

  function uploadStressTest($rootScope, $conf) {
    var confcopy = _.cloneDeep($conf || $rootScope.$conf);
    confcopy.state || (confcopy.state = {});
    _.defaults(confcopy.state, {
      lastbitrate: 0,
      stop: false
    });
    return new Promise(function (resolve, reject) {
      if (!!confcopy.state.stop)
        return resolve();

      setTimeout(function () {
        uploadTestPanel($rootScope, confcopy).then(function (res) {
          try {
            var p = _.sortBy(res, 'speed.bps')
            _.reverse(p);
            p = _.slice(p, 0, 4);
            var max = _.maxBy(p, 'speed.bps');
            var min = _.minBy(p, 'speed.bps');
            if ((min.speed.bps / max.speed.bps) < 0.9) {
              confcopy.limits.uploadStartSize = _.maxBy(p, 'size').size;
              confcopy.limits.uploadSizeModifier = 1.1;
              uploadStressTest($rootScope, confcopy).then(resolve);
            } else {
              confcopy.state.stop = true;
              resolve();
            }

          } catch (ex) {
            resolve();
          }

        }).catch(reject);
      }, 1);
    });

  } // end upload stress

  function downloadTestPanel($rootScope, $conf) {
    var state = {
      lastRuntime: 0
    };
    var conf = $conf || $rootScope.$conf;
    return new Promise(function (resolve, reject) {
      var tests = new Array(20);
      tests[0] = parseInt(conf.limits.downloadStartSize);
      for (var i = 1; i < tests.length; i++) {
        tests[i] = tests[i - 1] * conf.limits.downloadSizeModifier;
      }
      var testBinds = tests.filter(function (v) {
        return v <= conf.limits.maxDownloadSize;
      }).map(function (v) {
        return speedTest('down', Math.floor(v), $rootScope, conf, state);
      });

      Promise.series(testBinds).then(function (results) {
        $rootScope.$emit('speedtestpanelfinish', results);
        return results;
      }).then(resolve).catch(reject);
    });
  }

  function uploadTestPanel($rootScope, $conf) {
    var state = {
      lastRuntime: 0
    };
    var conf = $conf || $rootScope.$conf;
    return new Promise(function (resolve, reject) {
      var tests = new Array(10);
      tests[0] = parseInt(conf.limits.uploadStartSize);
      for (var i = 1; i < tests.length; i++) {
        tests[i] = tests[i - 1] * conf.limits.uploadSizeModifier;
      }
      var testBinds = tests.filter(function (v) {
        return v <= conf.limits.maxUploadSize;
      }).map(function (v) {
        return speedTest('up', Math.floor(v), $rootScope, conf, state);
      });

      Promise.series(testBinds).then(function (results) {
        $rootScope.$emit('speedtestpanelfinish', results);
        return results;
      }).then(resolve).catch(reject);
    });
  }

  function speedTest($dir, $size, $rootScope, $conf, $state) {
    function calc(results, e) {
      e || (e = {
        loaded: $size,
        total: $size
      });
      results.dl = e.loaded;
      results.end = Date.now();
      results.time = results.end - results.startD;
      results.percent = ((e.loaded / (e.total || $size)) * 100);
      results.downloaded = formatBytes(e.loaded, $size, 2).toString() + results.fdltype;

      var bpms = (results.dl * 8) / (results.time);
      results.speed.bps = bpms * 1000;
      results.speed.kbps = (bpms / 1000) * 1000;
      results.speed.mbps = (bpms / 1000 / 1000) * 1000;
      results.speed.gbps = (bpms / 1000 / 1000 / 1000) * 1000;

      results.bitrate = results.speed.bps;
      results.bittype = 'b'

      if (results.speed.kbps > 1) {
        results.bitrate = results.speed.kbps;
        results.bittype = 'Kb';
      }
      if (results.speed.mbps > 1) {
        results.bitrate = results.speed.mbps;
        results.bittype = 'Mb';
      }
      if (results.speed.gbps > 1) {
        results.bitrate = results.speed.gbps;
        results.bittype = 'Gb';
      }

      var fdlsize = (function (b) {
        if (b < 1000) return b + "b";
        if (b >= 1000 && b < 1000000) return (b / 1000) + "KB";
        if (b >= 1000000 && b < 1000000000) return (b / 1000000) + "MB";
        if (b >= 1000000000) return (b / 1000000000) + "GB";
      })(results.dl);

      (function (f) {
        results.fdl = new Number(f.replace(/[a-z]/gi, ''));
        results.fdltype = f.replace(/[0-9\.]/gi, '');
      })(fdlsize);

      var fsize = (function (b) {
        if (b < 1000) return b + "b";
        if (b >= 1000 && b < 1000000) return (b / 1000) + "KB";
        if (b >= 1000000 && b < 1000000000) return (b / 1000000) + "MB";
        if (b >= 1000000000) return (b / 1000000000) + "GB";
      })(results.size);

      (function (f) {
        results.fsize = new Number(f.replace(/[a-z]/gi, ''));
        results.fsizetype = f.replace(/[0-9\.]/gi, '');
      })(fsize);

      results.id = results.dir + results.size + results.start;
    };
    var results = {
      dir: $dir,
      start: startTime,
      startD: new Date(),
      end: 0,
      size: $size,
      downloaded: 0,
      dl: 0,
      percent: 0,
      time: 0,
      speed: {
        bps: 0,
        kbps: 0,
        mbps: 0,
      },
      bitrate: 'b'
    };

    return function (r, x) {
      if (!!$state.stopped) {
        r(null);
      }
      if ($dir == 'down' && $state.lastRuntime > ($conf.limits.maxDownloadTime * 1000))
        return r(null);
      if ($dir == 'up' && $state.lastRuntime > ($conf.limits.maxUploadTime * 1000))
        return r(null);

      results.start = startTime();
      var ropts = {
        url: './' + $dir + 'load?size=' + $size
        , method: ($dir == 'down') ? 'GET' : 'POST'
        , progress: function (e) {
          calc(results, e);
          $rootScope.$emit('speedupdate', results);
        }
      };
      if ($dir == "up") {
        var ua = new Uint8Array($size);
        ua.fill(0);
        ropts.data = new Blob([ua]);
        ropts.processData = false;
        ropts.contentType = "application/octet-stream";
      }

      var j = $.ajax(ropts);
      j.$st_abort = function () {
        $state.stopped = true;
        j.abort();
      };
      $rootScope.$testxhr = j;

      j.done(function () {
        calc(results);
        $state.lastRuntime = results.time;
        $rootScope.$emit('speedupdate', results);
        if ($conf.limits.restInterval > 0)
          return Promise.setTimeout($conf.limits.restInterval).then(r.bind(null, results));
        else
          return r(results);
      }).fail(x);
    };
  }
})();
