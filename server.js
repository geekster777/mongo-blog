var http = require('http');
var mongo = require('mongojs');
var db=mongo.connect('mongodb://0.0.0.0/blog', ["testData"]);
var counter = 0;
db.testData.remove();

http.createServer(function(request,response) {
	counter+=1;
	response.writeHead(200,{'Content-Type':'text/html'});
	response.write('<html><head></head><body>');
	var ipAddress = request.connection.remoteAddress;
	db.testData.save({ip: ipAddress, count: counter}, function(err,val) {
		if(err) throw err;
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
				response.end('<table></body></html>');
		});
	});
}).listen(80);

console.log("Server started");
