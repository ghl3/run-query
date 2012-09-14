
//
// d3
//

$(document).ready(function() {

    console.log("Document Ready");
    $("#Results").hide();

    // Setup the buttons
    $('#GetRunNumber').live('click', function(){ GetRunQueryData("run_number"); });
    $('#GetLastRun').live('click',   function(){ GetRunQueryData("last_run"); });

    // Gather any cached info
    var cached_run_number = localStorage.getItem("run_number");
    if(cached_run_number != null) {
	$("#run_number").val(cached_run_number);
    }

});


function GetRunQueryData(type) {

    // Create the waiting 'state'
    $("#Results").hide();
    $("#error").hide();
    $("#loading").ajaxStart(function () {
	$(this).show();
    });

    // Declare the Error Callback
    function error_callback() {
	console.log("Error: Unable to complete ajax request");
	$("#error").ajaxStop(function () {
	    $(this).show();
	});
	$("#loading").ajaxStop(function () {
	    $(this).hide();
	});
	$("#Results").hide();
    }

    // Create the query that we're going to do
    var query = null;

    if(type==""){
	console.log("Error: Must Enter a valid Query type");
	error_callback();
	return;
    }
    else if(type=="run_number"){
	var run_number_string = $("#run_number").val();
	console.log("Getting RunQuery info based on run number: " + run_number_string);
	localStorage.setItem("run_number", run_number_string);
	query = {type: "run_number", run_number: run_number_string};
    }
    else if(type=="last_run") {
	console.log("Getting RunQuery info based on last run");
	query = {type: "last_run"};
    }

    // Declare the success callback
    function run_query_callback(data) {
	console.log("Successfully Got RunQuery data");
	console.log(data);

	// Check the flag:
	if(data['flag'] == 2) {
	    console.log("No runs of the specified type found");
	    error_callback();
	    return;
	}
	if(data['flag'] != 0) {
	    console.log("Failed to successfully retrieve data");
	    error_callback();
	    return;
	}

	// Cache this query if it's a particular run number
	if( query["type"] == "run_number") {

	    // First, check if we have a query cache
	    query_cache = new Array();
	    if( localStorage.getItem("query_cache")==null) {
		query_cache = localStorage(localStorage.getItem("query_cache"));
	    }

	    // Store this query as a key, and the 
	    // url for the pickeled result as a val
	    query_cache[query] = data['pickle_url']; 
	    
	    // And finally, save back to storage
	    localStorage.setItem("query_cache", query_cache);
	}

	// Fill the Run Info
	$("#num_lb").html(data['num_lb']);
	$("#num_events").html(data['num_events']);
	$("#start_time").html(data['start_time']);
	$("#end_time").html(data['end_time']);
	// Fill the charts
	DrawBarChart(data['lb_lumi'],     "#LumiChart");
	DrawBarChart(data['lb_duration'], "#DurationChart");
	DrawBarChart(data['run_energy'],  "#RunEnergyChart");
	DrawBarChart(data['bunches'],     "#BunchesChart");

	console.log("Successfully Drew Lumi Data");

	// Restore the 'state'
	$("#Results").show();
	$("#loading").ajaxStop(function () {
	    $(this).hide();
	});
	
    } // End Callback

    console.log("Collecting Data from Run Query...");

    if(type==""){
	console.log("Error: Must Enter a valid Query type");
	error_callback();
	return;
    }
    else if(type=="run_number"){
	var run_number_string = $("#run_number").val();
	console.log("Getting RunQuery info based on run number: " + run_number_string);
	localStorage.setItem("run_number", run_number_string);
	$.post('LumiDuration', {type: "run_number", run_number: run_number_string}, run_query_callback)
	    .error(error_callback);
    }
    else if(type=="last_run") {
	console.log("Getting RunQuery info based on last run");
	$.post('LumiDuration', {type: "last_run"}, run_query_callback)
	    .error(error_callback);
    }
    else {
	console.log("Unknown Query type entered:" + type);
	error_callback();
	return;
    }

}


function DrawBarChart(data, selector_name) {

    var bar_width = 5;
    var h = 200;
    var max_height = Math.max.apply(null, data);

    var xPadding = 30;
    var yPadUp = 0.0;
    var yPadDown = 30.0;

    var xScale = d3.scale.linear()
	.domain([0, data.length])
	.range([xPadding, data.length*bar_width - xPadding*2]);
    
    var yScale = d3.scale.linear()
        .domain([0, 1.1*max_height])
        .rangeRound([h-yPadDown, yPadUp]);

    // Clear the svg and create a fresh one
    $(selector_name).empty();
    var chart = d3.select(selector_name).append("svg")
        .attr("class", "chart")
        .attr("width", bar_width*data.length - 1)
        .attr("height", h);

    // Create the bars
    chart.selectAll("rect")
        .data(data)
	.enter().append("rect")
        .attr("x", function(d, i) { return xScale(i); })
        //.attr("y", function(d) { return yScale(d) - (h - yPadding); })
	.attr("y", function(d) { return yScale(d); })
        .attr("width", bar_width)
        .attr("height", function(d) { return h - yPadDown - yScale(d) }); // Height is always scaled

    // Create the labels
    /*
    chart.selectAll("text")
	.data(data)
	.enter()
	.append("text")
	.text(function(d) {
	    if( parseFloat(d) < 0.01 ) return "0.0";
	    if( parseFloat(d) < 1.0 )  return parseFloat(d).toPrecision(1);
	    return parseFloat(d).toPrecision(3);
	})
	.attr("class", "lumi_label")
	.attr("x", function(d, i) {
	    var text_offset = 2;
	    return xScale(i) + text_offset; //*bar_width + 2;
	})
	.attr("y", function(d) {
	    var text_height = 5;
	    return h - yPadDown - text_height; //0.0; //h - (d * 4);
	})
	.attr("transform", "rotate(-90)");
    */

    // Create the axis lines
    /*
    chart.append("line")
        .attr("x1", 0)
        .attr("x2", bar_width*data.length)
        .attr("y1", h - yPadDown)
        .attr("y2", h - yPadDown)
        .style("stroke", "#000");
*/

    // Create the axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(20);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5);

    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - yPadDown ) + ")")
        .call(xAxis);

    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + xPadding + ", 0)")
        .call(yAxis);

    return;
}