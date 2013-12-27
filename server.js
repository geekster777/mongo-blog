/**
 * Server file, controls the incoming http request, then determines
 * where to direct it to receive a response.
 * Nick Hilton
 */


//include server
var http = require('http');

//connects to the database
var mongo = require('mongojs');
var db=mongo.connect('mongodb://0.0.0.0/blog', ["pages","users","comments"]);
var urlTool = require('url');
var fs = require('fs');
var qs = require('querystring');
var __contentdir = __dirname+"/content";
//clear the database when the server is restarted
//db.pages.remove();

/**
 * Will replace all instances of include statements with the actual file
 * that is to be included. Include statements are represented as:
 *    <!-- #include page.html -->
 * @param:
 * page: String - the content of the page
 */
function includeTemplates(page, callback) {

  //Finds any instance of a commented include statement with one argument
  var includePatt = /<!--#include\s+\S+\s*-->/m;
  
  var result = includePatt.exec(page);
  
  if( result !== null ) {
    console.log("TEMPLATE: "+result);
    //gets the filename
    var file = result.toString().replace("<!--#include",'');
    file = file.replace("-->",'');
    file = file.trim();
    file = "/"+file;
    
    //looks up the file in the database
    lookupPage(file, function(contents) {
      
      if(contents === "") {
        contents = fs.readFileSync(__contentdir+file).toString();
        if(contents==="")
          return;
      }
      
      //inserts the include into the content
      page = page.replace(result.toString(),contents);
      
      //recursively calls includeTemplates until all of the includes are taken
      //care of. It replaces includes one at a time. 
      includeTemplates(page, callback);
    });
  }
  else {
    //finally calls the initial callback
    callback(page);
  }
}

/** 
 * Checks the database for the existence of a page, and will return its data
 * @param  
 *  pageName: String - the name of the page being looked up in the database
 */
function lookupPage(pageName, callback) {
	if(pageName==null)
		return callback("");
	
	var page = "";
	
	//looks up the page in the database, 
	console.log("pageName: "+pageName);
  db.pages.findOne({_id: pageName}, function(err, result) {
    page="";
    if(err || result===null)
      callback("");
    else {
      console.log(result);
      page+=result.content;
      includeTemplates(page, callback);
    }
  });

}

//creates the server to listen for incoming requests
http.createServer(function(request,response) {
  var url = urlTool.parse(request.url);
  console.log(url.pathname); 
  if(request.method == "GET") {

    lookupPage(url.pathname, function(page) {
      if(page===""){
        console.log(__contentdir+url.pathname);
        //will look up the file in the filesystem if it is not found in the db.
        fs.readFile(__contentdir+url.pathname,function(err, data) {
          if(!err) {
            response.writeHead(200);
            response.end(data);
          }
          else {
            response.writeHead(404);
            response.end("404 not found!");
          }
        });
      }
      else {
        response.writeHead(200);
        response.end(page);
      }
    });

  }
  else if(request.method == "POST") {
    var requestBody = "";
    
    //reads all of the data from the post
    request.on('data', function(data) {
      requestBody+=data;
    });

    request.on('end', function() {
      var formData = qs.parse(requestBody);
      
      console.log(formData.pagename+"!");
      
      db.pages.save({_id:"/"+formData.pagename, content:formData.content});
      db.pages.findOne({_id:"/"+formData.pagename}, function(err, result) {
        
        if(err) {
          response.writeHead(213, {'Content-Type': 'text/html'});
          response.end("<html><body><h1>Error Saving.</h1></body></html>");
          return;
        }
        
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(result.content+"!!!"+result._id);
        console.log(result.content+"!!!"+result._id);
      });
    });
  }
}).listen(8080);

console.log("Server started");

