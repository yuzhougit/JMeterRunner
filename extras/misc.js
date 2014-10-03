var statusInterval;
var resultsInterval;
var statusUpdateInterval = 0;
var dataMap = {};
var httpSamples = {};
var testResultsMap = {};

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
			testResultsMap = {};
			//get each label and make a column for it
			$('testResults', returnedXMLResponse).children().each(function(){
				//success flag
				s = $(this).attr("s");
				//elapsed time
				t = parseInt($(this).attr("t"));
				//latency
				lt = parseInt($(this).attr("lt"));
				//timestamp
				ts = parseInt($(this).attr("ts"));
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
				by = parseInt($(this).attr("by"));
				try{
					httpSamples[lb].count ++;
					testResultsMap[lb][httpSamples[lb].count] = {"ts":ts,"lt":lt,"s":s,"t":t,"rc":rc,"by":by};
				}
				catch(e){
					httpSamples[lb] = {"count":1,"passed":0,"failed":0,"bytes":0,"latency":0,"response":0};
					testResultsMap[lb] = [1,{"ts":ts,"lt":lt,"s":s,"t":t,"rc":rc,"by":by}];
					}
				httpSamples[lb].response += parseInt(t);
				httpSamples[lb].latency += parseInt(lt);
				httpSamples[lb].bytes += parseInt(by);
				if(s=="true"){ 
					httpSamples[lb].passed ++;
				}
				else{httpSamples[lb].failed ++;}
				document.getElementById("resultsTicker").innerHTML += "<p>" + ts + "  " + lb + "  " + t + "  " + lt + "  " + s + "  " + rc + "</p>"
			})
			makeAllLabelGraphs()
		}  
    }); 
}

function makeAllLabelGraphs(){
	var trkeys = Object.keys(testResultsMap);
	var labelArray = [];
	for (var index = 0; index < trkeys.length; ++index) {	
		makeLabelGraph(trkeys[index]);
	}
}

function makeLabelGraph(label){

	var labelResultsArray = testResultsMap[label];
	var data = new google.visualization.DataTable;
	data.addColumn('datetime', 'Time');
    data.addColumn('number', "Passed");
    data.addColumn('number', "Failed");
    data.addColumn('number', "Latency");
	for(var tmpindex = 1; tmpindex < labelResultsArray.length; ++tmpindex){
		var labelResultsItem = labelResultsArray[tmpindex];
		if(labelResultsItem.s == "true"){
		data.addRow([new Date(labelResultsItem.ts), labelResultsItem.t, 0, labelResultsItem.lt]);	
		}
		else{data.addRow([new Date(labelResultsItem.ts), 0, labelResultsItem.t,labelResultsItem.lt]);}
		
	}	
	var charty = document.createElement("div")
	var chart = new google.visualization.ColumnChart(charty);
	var title = label + " (count:" + httpSamples[label].count + " passed:" + httpSamples[label].passed + " avg response:" + Math.round(httpSamples[label].response/httpSamples[label].count) + "ms)"
	var options = {'title':title, 'width':900, 'height':300};
    chart.draw(data, options);
    document.getElementById("summaryStats").appendChild(charty);
    //var tabley = document.createElement("div");
	//var table = new google.visualization.Table(tabley);
	//table.draw(data);
	//document.getElementById("testSummary").appendChild(tabley);
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
	var csvFile = document.getElementById("graphOption").value;
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