var express = require("express");
var fs = require('fs');
var path = require("path");
var md = require("markdown-it")({
  typographer: true
});
var emoji = require('markdown-it-emoji');
md.use(emoji);
var twemoji = require('twemoji');

md.renderer.rules.link_open = function (tokens, idx) {
  var title = tokens[idx].title ? (' title="' + replaceEntities(tokens[idx].title) + '"') : '';
  var target = tokens[idx].target ? (' target="' + tokens[idx].target + '"') : '';
  return '<a href="' + tokens[idx].href + '"' + title + target + '>' + ( (endsWith(tokens[idx].href, ".md") || endsWith(tokens[idx].href, "/")) || tokens[idx].href.indexOf('.') === -1 ? '' : '<img class="emoji" draggable="false" alt="⬇️" src="//twemoji.maxcdn.com/36x36/2b07.png"> ');
};

md.renderer.rules.emoji = function(token, idx) {
  return twemoji.parse(token[idx].to);
};
var _ = require("underscore");
var querystring = require('querystring');
var touch = require("touch");
var mkdirp = require("mkdirp");

var app = express();

app.get("/github-markdown.css", function(req, res){
	res.status(200).sendFile( __dirname + "/node_modules/github-markdown-css/github-markdown.css");
});

app.get("/emoji.js", function(req, res){
	res.status(200).sendFile( __dirname + "/node_modules/markdown-it-emoji/dist/markdown-it-emoji.min.js");
});

app.get("/js/bootstrap-markdown.js", function(req, res){
	res.status(200).sendFile( __dirname + "/js/bootstrap-markdown.js");
});

app.get("/js/markdown-editor.js", function(req, res){
	res.status(200).sendFile( __dirname + "/js/markdown-editor.js");
});

app.get("/css/bootstrap-markdown.min.css", function(req, res){
	res.status(200).sendFile( __dirname + "/css/bootstrap-markdown.min.css");
});

app.get("/js/codemirror/*", function(req, res){
	var filePath = querystring.unescape(req.path);
	fs.exists(__dirname + filePath, function(exists){
		if(exists){
			var reqPath = __dirname + filePath;
			fs.readFile(reqPath, function (err, data) {
				if (err) {
					console.log(err);
					return;
				}
				res.set('Content-Type', 'text/css');
				res.send(data.toString());
			});
		}else{
			res.status(404).send("Not Found");
		}
	});
});

app.get("/raw/*", function(req, res){
	var filePath = querystring.unescape(req.path);
	filePath = filePath.replace(/\/raw/, "");
	fs.exists(__dirname + filePath, function(exists){
		if(exists){
			var reqPath = __dirname + filePath;
			if(fs.lstatSync(reqPath).isDirectory()){
				reqPath = reqPath + "/index.md";
			}
			fs.readFile(reqPath, function (err, data) {
				if (err) {
					console.log(err);
					return;
				}
				res.set('Content-Type', 'text/plain');
				res.send(data.toString());
			});
		}else{
			res.status(404).send("Not Found");
		}
	});
});

app.get("/*", function(req, res){
	fs.readFile( __dirname + "/BaseTemplate.html", function (err, templateData) {
		console.log(__dirname + querystring.unescape(req.path));
		fs.exists(__dirname + (querystring.unescape(req.path)), function(exists){
			if(exists){
				sendRenderedResponse(__dirname + (querystring.unescape(req.path)), templateData, req, res);
			}else{
				mkdirp(__dirname + path.dirname(querystring.unescape(req.path)), null, function(err){
					if(err){
						res.status(500).send();
						return;
					}
					touch(__dirname + (querystring.unescape(req.path).replace(/\.[^/.]+$/, "")) + ".md", null, function(err){
						if(err){
							res.status(500).send();
							return;
						}
						sendRenderedResponse(__dirname + (querystring.unescape(req.path).replace(/\.[^/.]+$/, "")) + ".md", templateData, req, res);
					});
				});
			}
		});
	});
});

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function sendRenderedResponse(reqPath, templateData, req, res){
	if(fs.lstatSync(reqPath).isDirectory()){
		reqPath = reqPath + "/index.md";
	}
	if(endsWith(reqPath, ".md")){
		fs.readFile(reqPath, function (err, data) {
			if (err) {
				console.log(err);
				return;
			}
			var dataObj = {
				pageContent : md.render(data.toString()),
				title : path.basename(querystring.unescape(req.path)).replace(/\.[^/.]+$/, "")
			};
			res.send(_.template(templateData.toString())(dataObj));
		});
	}else{
		var stat = fs.statSync(reqPath);
		res.writeHead(200, {"Content-Type": "application/octet-stream", "Content-Length": stat.size});

		var readStream = fs.createReadStream(reqPath);
	    // We replaced all the event handlers with a simple call to readStream.pipe()
	    readStream.pipe(res);
	}
}

app.post("/*", function(req, res){
	var body = '';
    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        if (body.length > 1e6)
            req.connection.destroy();
    });
    req.on('end', function () {
        var post = querystring.parse(body);
        var reqpath = __dirname + querystring.unescape(req.path);
        if(fs.lstatSync(reqpath).isDirectory()){
     		reqpath = reqpath + "/index.md";   	
	    }
	    fs.writeFile(reqpath, body, function(){
        	res.status(200).send();
        });
    });
});

var server = app.listen(89, function(){

	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening at http://%s:%s', host, port);
});