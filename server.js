/**
 * Server file, controls the incoming http request, then determines 
 * where to direct it to receive a response.
 * Nick Hilton
 */
//include server
var http = require('http');

//connects to the database
var mongo = require('mongojs');
var db=mongo.connect('mongodb://0.0.0.0/blog', ["testData"]);

//clear the database when the server is restarted
db.testData.remove();

//creates the server to listen for incoming requests
http.createServer(function(request,response) {
	
	//writes that the request was received and valid
	response.writeHead(200,{'Content-Type':'text/html'});
	response.write('<html><head></head><body>');

	//writes the ip's of all previous visitors
	response.write("<h1>Hello world!</h1>\n");
	response.write("<table>");
	var items=db.testData.find();
	items.forEach(function(err,item) {
		if(item) {
			response.write("<tr>");
			response.write("<td>"+item.count+"</td>");
			response.write("<td>"+item.ip+'</td>');
			response.write("</tr>");
		}
		else
			response.end('</table></body></html>');
	});

	//finds the user's ip, and adds it to the database
	var ipAddress = request.connection.remoteAddress;
	
	db.testData.find({ip: ipAddress}).count( function(err, count) {
		if(count==0)
			db.testData.save({ip: ipAddress, count: 0}, function(err,val) {
				if(err) throw err;
			});
		else {
			db.testData.update({ip: ipAddress}, {$inc : { count: 1}});
		}
	});
		
}).listen(80);

console.log("Server started");
