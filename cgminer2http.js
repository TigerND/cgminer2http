
var minerPort = 4028
var localPort = 4029

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

	console.log('Q: ' + cmd);	
	var client = net.connect(
		{port: minerPort},
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
		  response.setHeader('Content-Type', 'application/json')
		  response.setHeader('Content-Length', Buffer.byteLength(body))
		  console.log('A: ' + body)
		  response.end(body)
		}
	)
})

app.listen(localPort);
console.log('Server has started at port ' + localPort);