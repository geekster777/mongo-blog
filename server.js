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

/**
 * Will replace all instances of include statements with the actual file
 * that is to be included. Include statements are represented as:
 *    <!-- #include page.html -->
 * @param:
 * page: String - the content of the page
 */
function includeTemplates(page) {

  //Finds any instance of a commented include statement with one argument
  var includePatt = /<!--#include\s+\S+\s*-->/m;
  while( includePatt.test(page) ) {
    //gets the filename
    var pos = includePatt.lastIndex;
    var file = includePatt.source.replace(/<!--#include|-->/,'');
    file = file.trim();
    
    //looks up the file in the database
    var contents = lookupPage(file);
    
    if(contents === null) {
      contents = fs.readFileSync(file).toString();
      if(contents===null)
        continue;
    }
    
    //inserts the include into the content
    page.replace(includePatt.source,contents);
  }

  return page;
}

/** 
 * Checks the database for the existence of a page, and will return its data
 * @param  
 *  pageName: String - the name of the page being looked up in the database
 */
function lookupPage(pageName) {
	if(pageName===null)
		return "";
	
	var page = "";
	
	//looks up the page in the database, 
	var results=db.pages.find({name: pageName});
	results.forEach(function(err,item) {
		page="";
		page+=item.content;
	});
  
  includeTemplates(page, db);

  return page;
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
      else {
        response.writeHead(404);
        response.write("404 not found!");
      }
    });
  }
  else {
    response.writeHead(200);
    response.write(page);
  }

}).listen(8080);

console.log("Server started");


