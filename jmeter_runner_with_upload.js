var path = require("path");
var http = require('http');
var qs = require('querystring');
var fs = require('fs');
var sys = require('sys');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
//var jmeterBinPath = "/home/ec2-user/apache-jmeter-2.11/bin/";
var jmeterBinPath = "";
//var jmeterPath = '/home/ec2-user/jmeter/';
var jmeterPath = './';
var jmeterTestsPath = jmeterPath + 'tests/';
var jmeterTestResultsPath = jmeterPath + 'testresults/';
var data = ""; 
var testRunFolder = "";
var resultsFolder = "";
var resourcesFolder = "";
var reportsFolder = "";
var exec = require('child_process').exec;
var util = require('util');
var multiparty = require('multiparty');
var serve = serveStatic(jmeterPath);
var ts = "";
var timeoutId = "";
var reportTimeoutId = "";
var testList = "";

function updateInterimResults(){
	function puts(error, stdout, stderr) { sys.puts(stdout); }
	var jmeterRunnerStatus = fs.readFileSync(resultsFolder + "/jmeterRunnerStatus.log", 'utf8');
		var execStatement = "";
	if(jmeterRunnerStatus.indexOf("end of run") > 0){
		execStatement = "cat " + resultsFolder + "/output_results.jtl > " + resultsFolder + "/interim_results.jtl";
	}
	else{
		execStatement = "cat " + resultsFolder + "/output_results.jtl > " + resultsFolder + "/interim_results.jtl; echo '</testResults>' >> " + resultsFolder + "/interim_results.jtl";
	}
	execStatement += " " + jmeterPath + "resultsProcessor.sh " + testRunFolder + " interim_results.jtl";
	exec(execStatement, puts);
}

function getTestList(){
	exec('find ./ | grep .jmx', function(err, out, code) {
  //if (err instanceof Error)
  //  throw err;
  //process.stderr.write(err);
  //process.stdout.write(out);
  testList = out.split("\n");
  //process.exit(code);
});
	
}

function awkResults(){
		function putsAwk(error, stdout, stderr) { sys.puts(stdout); }
		var execAwkStatement = "cat " + resultsFolder + "/output_results.jtl | | awk -F'\\\"' '/^<http/ {print $2\",\"$4\",\"$6\",\"$8\",\"$10\",\"$12\",\"$14\",\"$16\",\"$18\",\"$20}' > " + resultsFolder + "/output_summary.jtl";
		console.log(execAwkStatement);
		exec(execAwkStatement, putsAwk);
}

getTestList();

http.createServer(function (req, res) {
	var ParamsWithValue = qs.parse(require('url').parse(req.url).query);
	console.log("action:" + ParamsWithValue.action);
	console.log(req.url);
	switch(ParamsWithValue.action) {	
	case 'runTest':
    var form = new multiparty.Form();
    
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.writeHead(400, {'content-type': 'text/plain'});
        res.end("invalid request: " + err.message);
        return;
      }
      //need to clear the test directory
    	var execStatement = "rm -r ./currentTest*; ";
      var upload = util.inspect(files);
      //console.log(upload);
      var uploadedFiles = files.upload;
      for (var index = 0; index < uploadedFiles.length; ++index) {
        var uploadedFile = uploadedFiles[index];
        execStatement += "cp " + uploadedFile.path + " ./currentTest" + uploadedFile.originalFilename + "; ";
      }
      //exec(execStatement, function(err, out, code) {console.log(out.toString());});
		
		//make unique folder
		ts = new Date().valueOf();
		testRunFolder = jmeterTestResultsPath + ts;
		resultsFolder = testRunFolder + "/results";
		reportsFolder = testRunFolder + "/reports";
		resourcesFolder = testRunFolder + "/resources";
		execStatement += "mkdir " + testRunFolder + "; ";
		execStatement += "mkdir " + resultsFolder + "; ";
		execStatement += "mkdir " + reportsFolder + "; ";
		execStatement += "mkdir " + resourcesFolder + "; ";
		execStatement += "cp " + jmeterPath + "extras/misc.js " + resourcesFolder + "/; ";
		execStatement += "cp " + jmeterPath + "extras/testRunResults.html " + reportsFolder + "/; ";
		execStatement += "cp " + jmeterPath + "extras/jmeter-tree_view.xsl " + resourcesFolder + "/; ";
		execStatement += "cp " + jmeterPath + "extras/jmeter-results-report_21.xsl " + resourcesFolder + "/; ";
		execStatement += "cp " + jmeterPath + "extras/jmeter-results-detail-report_21.xsl " + resourcesFolder + "/; ";
		execStatement += "cd currentTest; "
		execStatement += jmeterBinPath + "jmeter -n -t *.jmx" + decodeURI(ParamsWithValue.arguments) + " -Jjmeter.save.saveservice.thread_counts=true -l " + resultsFolder + "/output_results.jtl -j " + resultsFolder + "/jmeter.log > " + resultsFolder + "/jmeterRunnerStatus.log";
		console.log(execStatement);
		exec(execStatement, function(err, out, code) {console.log(out.toString());});
    });		
		setTimeout(
			function(){
				res.writeHead(302, "FOUND", {'Location': '/testresults/' + ts + '/reports/testRunResults.html'});
				res.end();
		},5000);
		break;
	case 'getUpdate':
		awkResults(res);
		function putsAwk(error, stdout, stderr) { sys.puts(stdout);}
		var execAwkStatement = "cat " + resultsFolder + "/output_results.jtl | awk -F'\\\"' '/^<http/ {print $2\",\"$4\",\"$6\",\"$8\",\"$10\",\"$12\",\"$14\",\"$16\",\"$18\",\"$20\",\"$22\",\"$24}' > " + resultsFolder + "/output_summary.jtl";
		console.log(execAwkStatement);
		exec(execAwkStatement, putsAwk);
		setTimeout(
			function(){
				res.writeHead(302, "FOUND", {'Location': '/testresults/' + ts + '/reports/testRunResults.html'});
				res.end();
		},5000);
		break;
	case 'getDetails':
		updateInterimResults();
		res.writeHead(200, "OK", {'Content-Type': 'text/html'});
		res.end("ok");		
		break;
	case 'testRunner':
		res.writeHead(200, "OK", {'Content-Type': 'text/html'});
		res.write('<html><head><meta charset="utf-8"><title>JMeter Test Runner</title>');
		res.write('<link rel="stylesheet" href="//code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css">');
		res.write('<script src="//code.jquery.com/jquery-1.10.2.js"></script>');
		res.write('<script src="//code.jquery.com/ui/1.11.1/jquery-ui.js"></script>');
		//res.write('<link rel="stylesheet" href="/resources/demos/style.css">');
		res.write('<script>  $(function() {    $( "#tabs" ).tabs();  });  </script></head><body>');	
		res.write('<div id="tabs">');
		res.write('<ul>');
		res.write('<li><a href="#runTest">Run Test</a></li>');
    res.write('<li><a href="#viewResults">View Results</a></li>');
		res.write('</ul>');
		res.write('<div id="runTest">');
		res.write('<form href="/?action=runTest" action="runTest" enctype="multipart/form-data" method="post">');
    res.write('<input type="file" name="upload" multiple="multiple"><br>');
    res.write('<input type="text" name="arguments" value="-Jthreads=1 -Jloopcount=10" size=30><br>');
    res.write('<input type="hidden" name="refreshRate" value="10000"><br>');
    res.write('<input type="submit" value="Run">');
		res.write('<input type="hidden" name="action" value="runTest">');
    res.write('</form>');
		res.write('</div>');
		res.write('<div id="viewResults">');
		
		var testResultsList = fs.readdirSync(jmeterTestResultsPath);
		for(var i in testResultsList) {
			console.log(testResultsList[i]);
			res.write('<p><a href="/testresults/' + testResultsList[i] + '/reports/testRunResults.html" target="_blank">' + testResultsList[i] + '</a></p>');
		}
		res.write('</div></div></body></html');
		res.end();
		break;
	case 'finalReport':
		function putsFinal(error, stdout, stderr) { sys.puts(stdout);}		
		var execFinalStatement = jmeterPath + "resultsProcessor.sh " + testRunFolder + " output_results.jtl";
		exec(execFinalStatement, putsFinal);
		res.writeHead(200, "OK", {'Content-Type': 'text/html'});
		res.end("ok");
		break;
  default:
		var done = finalhandler(req, res);
		if(req.url == "/"){
			res.writeHead(302, "FOUND", {'Location': '/?action=testRunner'});
			res.end();
		}
		else{
			serve(req, res, done);
		}
		break;
  }
}).listen(process.env.PORT || 12989);
//}).listen(12989);
