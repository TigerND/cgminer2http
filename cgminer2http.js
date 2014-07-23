
var path = require('path')

var config = require('konfig')({ path: path.join(__dirname, 'config') })

var express = require('express'),
	jade = require('jade'),
	net = require('net'),
	url = require('url')	

var app = express();
app.use(express.urlencoded())
app.use(express.json())

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
	response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
	response.setHeader('Content-Length', Buffer.byteLength(body))
	if (config.app.debug) console.log('A: ' + body)
	response.end(body)
}

app.post('/', function(request, response) {	
	var json = false
	try {		
		var address = 'tcp://' + config.app.miner.host + ':' + config.app.miner.port
		var command = null 
		if (config.app.debug) console.log(JSON.stringify(request.body))
		if (request.body.api != undefined) {
			address = 'tcp://' + request.body.api.address
			if (typeof request.body.api.command == "string") {
				command = request.body.api.command
			} else {
				command = JSON.stringify(request.body.api.command)
			}			 
		} else {		
			body = formatError('Invalid parameters', json)
			sendResponse(response, body)
			return
		}
		if (command['0'] == '{') {
			json = true
		}
		var uri = url.parse(address) 
		var params = {
			host: uri.hostname || config.app.miner.host,
			port: uri.port || config.app.miner.port
		}
		
		var body = ''
	
		if (config.app.debug) console.log('Q ' + JSON.stringify(params) + ': ' + cmd);	
		var client = net.connect(params, function() {
			client.write(command)
		})
		client.on('error', function(err) {
			console.log(params.host + ":" + params.port + ": " + (err.message || err.errno))
			body = formatError(err.message || err.errno, json)
			sendResponse(response, body)
		})
		client.on('data', function(data) {
			body += data
		})
		client.on('end', function() {
			sendResponse(response, body.substring(0, body.length - 1))
		})
	} catch(err) {
		body = formatError(err, json)
		sendResponse(response, body)
	}	 
})

app.get('/', function(request, response) {
    jade.renderFile(path.join(__dirname, 'command.jade'), {}, 
    	function (err, html) {
	    	if (err) throw err
			response.setHeader('Content-Type', 'text/html')
			response.setHeader('Content-Length', Buffer.byteLength(html))
			response.end(html)
	    }
    )
})

app.listen(config.app.local.port);
console.log('Server has started at port ' + config.app.local.port);