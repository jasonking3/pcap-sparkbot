var rp = require('request-promise');
var Promise = require('promise');
var debug = require('debug')('pcap');

var help_text = 'Hello!  I am a bot that can assist with launching packet captures on Cisco IOS-XE devices.  ' +
                'I make use of the packet capture API found [here](https://github.com/chrishocker/xepacketcap).  ' +
                'If your device has this API installed, you can ask me to start a packet capture using the following syntax:\n\n' +
                '**capture device** [device] **interface** [interface] **proto** [ip|tcp|udp] **src** [src] **dst** [dst] **duration** [duration]\n\n' +
                'Where:  \n' +
                '- device = FQDN or IP address of the IOS-XE device  \n' +
                '- interface = the interface to capture, ie. GigabitEthernet1  \n' +
                '- proto = the protocol to capture, ie. ip, tcp or udp  \n' +
                '- src = the source address to capture, ie. any or standard Cisco ACL source address specification  \n' +
                '- dst = the destination address to capture, ie. any or standard Cisco ACL source address specification  \n' +
                '- duration = the duration to run the capture in seconds\n\n' +
                'For example:\n\n' +
                '**capture device** 192.168.0.1 **interface** Gi1 **proto** tcp **src** any **dst** any **duration** 10\n\n';                ;

module.exports = function(controller) {

    function pcap_start(bot, message, device, iface, proto, src, dst, duration) {
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
                    "duration": duration
                }
            };
            debug('pcap_start: ' + JSON.stringify(options));
            bot.reply(message, 'Connecting to device ' + device);
            rp(options).then(function (response) {
                debug('pcap_start: ' + JSON.stringify(response));
                resolve(response);
            }).catch(function (err) {
                console.log('Error starting capture ' + err);
                bot.reply(message, 'Error starting capture on device ' + device + ': ' + err);
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
                    debug('pcap_status: ' + JSON.stringify(response));
                    setTimeout(request, delay);
                }
            }).catch(function (err) {
                console.log('pcap_status: error occurred checking job result ' + err);
            });
        }, delay);
    }

    function pcap_result(job, bot, message) {
        if(job.status == 'UPLOADED')
            bot.reply(message, 'Job ' + job.job_id + ' completed successfully.  Capture is at ' + job.url);
        else
            bot.reply(message, 'Job ' + job.job_id + ' failed.');
    }

    controller.hears(['^capture device (.*) interface (.*) proto (.*) src (.*) dst (.*) duration (.*)$'], 'direct_message,direct_mention', function(bot, message) {
        pcap_start(bot, message, message.match[1], message.match[2], message.match[3], message.match[4], message.match[5], message.match[6]).then( function (job) {
            bot.reply(message, 'Started capture job ' + job.job_id + ' on device ' + message.match[1]);
            pcap_status(message.match[1], job.job_id, pcap_result, bot, message);
        });
    });

    controller.hears(['help'], 'direct_message,direct_mention', function(bot, message) {
        bot.reply(message, help_text);
    });

    controller.hears(['.*'], 'direct_message,direct_mention', function(bot, message) {
        bot.reply(message, 'I\'m sorry, I did not understand your request.  Try asking me for help using the **help** command.');
    });
    
};
