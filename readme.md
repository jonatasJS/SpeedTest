# speedtest

This is a simple NodeJS http "internet" speed test. The aim to make it easy to run a http speedtest over your own WAN, VPN, or whatever network.

# Run
```bat
node ./bin/speed.js
```
Open your browser and go to http://hostname:8080/.

# Default behaviors/config

bin/config.json
```js
{
  //local port to listen on.
  //can be overridden by setting env ST_PORT
  "port": 8080,

  //local ip to bind with.
  //can be overridden by setting env ST_ADDR
  "ip": "0.0.0.0",

  "limits": {
    //define start, max size, and test series size modifiers.
    //server side will not serve up anything larger or accept any more data than is defined here.
    "downloadStartSize": "100000"
    ,"uploadStartSize": "2000000"
    ,"downloadSizeModifier": "2"
    ,"uploadSizeModifier": "1.5"
    ,"maxDownloadSize": "2000000000"
    ,"maxUploadSize": "100000000"

    //tests over this number of seconds kills the test panel.
    ,"maxDownloadTime": "8"
    ,"maxUploadTime": "4"

     //UI only, milliseconds between tests.
    ,"restInterval": "0"
  }
}
```

### Stress tests
Run until until the min/max of the top 4 tests results are without 10% of each other.


# Observations/Bugs

Original development was on Windows and it seemed to max out at about 20-30MBps (160Mbps - 240Mbps) when using localhost.

Later development has been done on Ubuntu and node v8. The highest speed seen hit ~1.7Gbps on localhost.

Credits
=========
* [jQuery](http://jquery.com/)
* [Jquery Ajax Progress](https://github.com/englercj/jquery-ajax-progress) by Chad Engler
* [lodash](https://lodash.com)
* [angularjs](https://angularjs.org)
* [popperjs](https://popper.js.org/)
* [Bootstrap](https://getbootstrap.com/)
* [dev-zero-stream](https://github.com/mafintosh/dev-zero-stream/blob/f61f06911fc60eb57645d502e53d35a3acfa31d4/index.js) by Mathias Buus
* [orderObjectBy](http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/) by Justin Klemm
