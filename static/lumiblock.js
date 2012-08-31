
//
// d3
//

$(document).ready(function() {

    console.log("Document Ready");
    $("#Results").hide();
    $('#GetData').live('click', GetRunQueryData);

    var cached_run_number = localStorage.getItem("run_number");
    if(cached_run_number != null) {
	$("#run_number").val(cached_run_number);
    }

});


function GetRunQueryData() {

    $("#Results").hide();
    $("#error").hide();

    $("#loading").ajaxStart(function () {
	$(this).show();
    });

    function run_query_callback(data) {
	console.log("Successfully Got RunQuery data");
	console.log(data);

	// Check the flag:
	if(data['flag'] != 0) {
	    console.log("Failed to successfully retrieve data");
	    $("#error").ajaxStop(function () {
		$(this).show();
	    });
	    $("#loading").ajaxStop(function () {
		$(this).hide();
	    });
	    $("#Results").hide();
	    return;
	}

	// Fill the charts
	DrawBarChart(data['lb_lumi'],     "#LumiChart", false);
	DrawBarChart(data['lb_duration'], "#DurationChart", false);

	console.log("Successfully Drew Lumi Data");

	$("#Results").show();
	$("#loading").ajaxStop(function () {
	    $(this).hide();
	});
	
    }

    console.log("Collecting Data from Run Query...");
    var run_number_string = $("#run_number").val();
    localStorage.setItem("run_number", run_number_string);
    $.post('LumiDuration', {run_number: run_number_string}, run_query_callback);
    
}


function DrawBarChart(data, selector_name, log) {

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