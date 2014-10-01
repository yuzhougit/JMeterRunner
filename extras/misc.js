var statusInterval;
var resultsInterval;
var statusUpdateInterval = 0;
var dataMap = {};
var httpSamples = {};
var testResultsMap = {};
//var labelList = {};

// load the visualization library from Google and set a listener
google.load("visualization", "1", {packages:["corechart"]});
google.load('visualization', '1', {packages: ['table']});
google.setOnLoadCallback(startStatusUpdates);

function getListenerData(){
	$.ajax({
        url: '../results/interim_results.jtl',
        type: 'GET', 
        dataType: 'xml',
        success: function(returnedXMLResponse){
			//reset the maps
			httpSamples = {};
			//testResultsMap = {};
			//$.parseXML(returnedXMLResponse).find().children().each{
			//get each label and make a column for it
			$('testResults', returnedXMLResponse).children().each(function(){
				//success flag
				s = $(this).attr("s");
				//elapsed time
				t = $(this).attr("t");
				//latency
				lt = $(this).attr("lt");
				//timestamp
				ts = $(this).attr("ts");
				//label
				lb = $(this).attr("lb"); 
				//response code
				rc = $(this).attr("rc");
				//response message
				rm = $(this).attr("rm");
				//thread name
				tn = $(this).attr("tn");
				//data type
				dt = $(this).attr("dt");
				//bytes
				by = $(this).attr("by");
				try{
					httpSamples[lb].count ++;
					//testResultsMap[lb][httpSamples[lb].count] = {"ts":ts,"lt":lt,"s":s,"t":t,"rc":rc,"by":by};
				}
				catch(e){
					httpSamples[lb] = {"count":1,"passed":0,"failed":0,"bytes":0,"latency":0,"response":0};
					//testResultsMap[lb][1] = {"ts":ts,"lt":lt,"s":s,"t":t,"rc":rc,"by":by};
					}
				httpSamples[lb].response += parseInt(t);
				httpSamples[lb].latency += parseInt(lt);
				httpSamples[lb].bytes += parseInt(by);
				if(s=="true"){ 
					httpSamples[lb].passed ++;
				}
				else{httpSamples[lb].failed ++;}
			})
			
			var keys = Object.keys(httpSamples);
			//put in a pretty table
			var summaryTable = document.getElementById("summaryTable");
			var tableContents = "<tr><th>Transaction</th><th>Count</th><th>Passed</th><th>Bytes</th><th>Latency</th><th>Response</th></tr>";
			for (index = 0; index < keys.length; ++index) {
				tableContents += "<tr><td>" + keys[index] + "</td><td>" + httpSamples[keys[index]].count + "</td><td>" + httpSamples[keys[index]].passed + "</td><td>" + httpSamples[keys[index]].bytes + "</td><td>" + Math.round(httpSamples[keys[index]].latency / httpSamples[keys[index]].count) + "</td><td>" + Math.round(httpSamples[keys[index]].response / httpSamples[keys[index]].count) + "</td></tr>";
			}
			summaryTable.innerHTML = tableContents;		
		}  
    }); 
}
	
function getRunnerStatus(){
	$.get("../results/jmeterRunnerStatus.log", function(statusLog) {
	var sl = statusLog.replace(/\n/g,"<br>");
	document.getElementById("runnerStatus").innerHTML = sl;
	if(sl.indexOf("end of run") > 0){
		clearInterval(statusUpdateInterval);
		clearInterval(logUpdateInterval);
		clearInterval(listenerUpdateInterval);
		document.getElementById("testSummary").innerHTML = "<p>Test finished</p>";
	}
	else{
		document.getElementById("testSummary").innerHTML = "<p>Test running...</p>";
	}
	});
}

function getJmeterLog(){
	$.get("../results/jmeter.log", function(data) {
	var sl = data.replace(/\n/g,"<br>");
	document.getElementById("jmeterLog").innerHTML = sl;
	});
}

function startStatusUpdates(){
	statusUpdateInterval = setInterval(function(){getRunnerStatus()},1000);	
	logUpdateInterval = setInterval(function(){getJmeterLog()},1000);
	listenerUpdateInterval = setInterval(function(){getListenerData();},1000);
}

function makeGraph(){
	csvFile = document.getElementById("graphOption").value;
    // grab the CSV
    $.get(csvFile, function(csvString) {
    // transform the CSV string into a 2-dimensional array
		var arrayData = $.csv.toArrays(csvString, {onParseValue: $.csv.hooks.castToScalar});
		//this new DataTable object holds all the data
        var data = new google.visualization.arrayToDataTable(arrayData);
			
        var options = {
         title: document.getElementById("graphOption").options[document.getElementById("graphOption").selectedIndex].text,
          hAxis: {title: data.getColumnLabel(0), minValue: data.getColumnRange(0).min, maxValue: data.getColumnRange(0).max},
          vAxis: {title: "ms", minValue: data.getColumnRange(2).min, maxValue: data.getColumnRange(2).max},
          legend: document.getElementById("graphOption").options[document.getElementById("graphOption").selectedIndex].text,
		  interpolateNulls: true,
		  crosshair: { trigger: 'both' }
        };
          var chart = new google.visualization.LineChart(document.getElementById('csv2chart'));
          chart.draw(data, options);
		  var table = new google.visualization.Table(document.getElementById('csv2table'));
		  table.draw(data);
         });
   }