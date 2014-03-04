
var config = require('konfig')()

var express = require('express'),
	jade = require('jade'),
	net = require('net'),
	url = require('url')

var app = express();
app.use(express.bodyParser())

app.get('/', function(request, response) {
    jade.renderFile('command.jade', {}, 
    	function (err, html) {
	    	if (err) throw err
			response.setHeader('Content-Type', 'text/html')
			response.setHeader('Content-Length', Buffer.byteLength(html))
			response.end(html)
	    }
    )
})

app.post('/', function(request, response) {	
	var cmd = request.body.api.cmd
	var body = ''

	if (config.app.debug) console.log('Q: ' + cmd);	
	var client = net.connect(
		{port: config.app.miner.port},
	    function() {
			client.write(cmd)
		}
	)
	client.on('data',
		function(data) {
			body += data
		}
	)
	client.on('end',
		function() {	  
			if ((body) && (body[0] == '{')) {
				response.setHeader('Content-Type', 'application/json')  
			} else {
				response.setHeader('Content-Type', 'text/plain')
			}		  
			response.setHeader('Content-Length', Buffer.byteLength(body))
			if (config.app.debug) console.log('A: ' + body)
			response.end(body)
		}
	)
})

app.listen(config.app.local.port);
console.log('Server has started at port ' + config.app.local.port);