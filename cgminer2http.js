
var config = {
	app: {
		debug: false,
		local: {
			port: 4029
		},
		remote: {
			port: 4028
		}
	}
}

var express = require('express'),
	jade = require('jade'),
	net = require('net'),
	url = require('url')

var app = express();
app.use(express.urlencoded())

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

function formatError(err, json)
{
	now = new Date().getTime()
	if (json) {
		return '{"STATUS":[{"STATUS":"E","When":' + now + ',"Code":14,"Msg":"' + err + '","Description":"n/a"}],"id":1}'
	} else {
		return 'STATUS=E,When=' + now + ',Code=14,Msg=' + err + ',Description=n/a|'
	}
}
function sendResponse(response, body)
{
	if ((body) && (body[0] == '{')) {
		response.setHeader('Content-Type', 'application/json')  
	} else {
		response.setHeader('Content-Type', 'text/plain')
	}		  
	response.setHeader('Content-Length', Buffer.byteLength(body))
	if (config.app.debug) console.log('A: ' + body)
	response.end(body)
}

app.post('/', function(request, response) {	
	var json = false
	try {		
		var cmd 
		if (request.body.api != undefined) {
			cmd = request.body.api.cmd 
		} else {		
			cmd = JSON.stringify(request.body)
		}
		if (cmd['0'] == '{') {
			json = true
		}
		
		var body = ''
	
		if (config.app.debug) console.log('Q: ' + cmd);	
		var client = net.connect(
			{port: config.app.miner.port},
		    function() {
				client.write(cmd)
			}
		)
		client.on('error',
			function(err) {
				console.log(JSON.stringify(err))
				body = formatError(err.errno.toString(), json)
				sendResponse(response, body)
			}
		)
		client.on('data',
			function(data) {
				body += data
			}
		)
		client.on('end',
			function() {
				sendResponse(response, body.substring(0, body.length - 1))
			}
		)
	} catch(err) {
		body = formatError("Internal error", json)
		sendResponse(response, body)
	}	 
})

app.listen(config.app.local.port);
console.log('Server has started at port ' + config.app.local.port);