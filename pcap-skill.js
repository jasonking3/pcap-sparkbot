var rp = require('request-promise');
var Promise = require('promise');
var debug = require('debug')('pcap');

module.exports = function(controller) {

    function pcap_start(bot, message, device, iface, proto, src, dst) {
        return new Promise(function (resolve, reject) {

            var options = {
                method: 'POST',
                uri: 'http://' + device + ':5000/pcap_json',
                json: true,
                body: {
                    "iface": iface,
                    "proto": proto,
                    "src": src,
                    "dst": dst,
                    "bucket": "codefest-pcap",
                    "filename": "foo.pcap",
                    "duration": 10
                }
            };
            debug('pcap_start: ' + JSON.stringify(options));
            bot.reply(message, 'Connecting to device ' + device);
            rp(options).then(function (response) {
                debug('pcap_start: ' + JSON.stringify(response));
                resolve(response);
            }).catch(function (err) {
                console.log('Error starting capture ' + err);
                bot.reply(message, 'Error starting capture ' + err + ' on device ' + device);
                reject(err);
            });
            
        });
    }

    function pcap_status(device, job_id, callback) {

        // extract extra callback arguments
        var args = Array.prototype.splice.call(arguments, 3);

        var options = {
            method: 'POST',
            uri: 'http://' + device + ':5000/status_json',
            body: { "job_id": job_id },
            json: true
        };
        debug('pcap_status: ' + JSON.stringify(options));
        let delay = 2000; // check job status every two seconds
    
        setTimeout(function request() {
            rp(options).then(function (response) {
                if(['UPLOADED', 'ERROR'].includes(response.status)) {
                    debug('pcap_status: ' + JSON.stringify(response));
                    if (args) {
                        args.unshift(response); // insert job data into args
                        callback.apply(null, args);
                    } else {
                        callback(response);
                    }
                } else {
                    setTimeout(request, delay);
                }
            }).catch(function (err) {
                console.log('Error occurred checking job result ' + err);
            });
        }, delay);
    }''

    function pcap_result(job, bot, message) {
        if(job.status == 'UPLOADED')
            bot.reply(message, 'Job ' + job.job_id + ' completed successfully.  Capture is at ' + job.url);
        else
            bot.reply(message, 'Job ' + job.job_id + ' failed.');
    }

    controller.hears(['^capture device (.*) interface (.*) proto (.*) src (.*) dst (.*)$'], 'direct_message,direct_mention', function(bot, message) {
        pcap_start(bot, message, message.match[1], message.match[2], message.match[3], message.match[4], message.match[5]).then( function (job) {
            bot.reply(message, 'Started capture job ' + job.job_id + ' on device ' + message.match[1]);
            pcap_status(message.match[1], job.job_id, pcap_result, bot, message);
        });
    });

};