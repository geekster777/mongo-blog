/**
 * Server file, controls the incoming http request, then determines
 * where to direct it to receive a response.
 * Nick Hilton
 */


//include server
var http = require('http');

//connects to the database
var mongo = require('mongojs');
var db=mongo.connect('mongodb://0.0.0.0/blog', ["pages","templates","users","comments"]);
var urlTool = require('url');
var fs = require('fs');

//clear the database when the server is restarted
db.testData.remove();

//Checks the database for the existence of a page, and will return its data
function lookupPage(pageName, db) {
	if(pageName===null)
		return "";
	
	var page = "";
	
	//looks up the page in the database, 
	var results=db.pages.find({name: pageName});
	results.forEach(function(err,item) {
		page="";
		page+=item.content;
	});
  
}

//creates the server to listen for incoming requests
http.createServer(function(request,response) {
    var url = urlTool.parse(request.url);
    var page = lookupPage(url.pathname);

    if(page===null){

        //will look up the file in the filesystem if it is not found.
        fs.readFile(__dirname+url.pathname,function(err, data) {
            if(!err) {
                response.write(200);
                response.write(data);
            }
            else
                response.writeHead(404);
                response.write("404 not found!");
        });
    }
    else {
        response.writeHead(200);
        response.write(page);
    }


}).listen(8080);

console.log("Server started");


