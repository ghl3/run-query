
//
// d3
//

/// Menu
/// Results
/// GetData


$(document).ready(function() {
    console.log("Document Ready");

    $("#Results").hide();

    $('#GetData').live('click', GetRunQueryData);


});

function GetRunQueryData() {

    $("#Results").hide();

    function run_query_callback(data) {
	console.log("Successfully Got RunQuery data");
	console.log(data);

	// Fill the charts
	DrawBarChart(data['lb_lumi'],     "#LumiChart", false);
	DrawBarChart(data['lb_duration'], "#DurationChart", false);

	console.log("Successfully Drew Lumi Data");

	$("#Results").show();
    }

    console.log("Collecting Data from Run Query...");
    var run_query_string = "";
    $.post('LumiDuration', run_query_string, run_query_callback);

}

function DrawBarChart(data, selector_name, log) {

    var w = 20;
    var h = 200;

    var max_height = Math.max.apply(null, data);
    
    var x = d3.scale.linear()
        .domain([0, 1])
        .range([0, w]);
    
    var y = d3.scale.linear()
        .domain([0, max_height])
        .rangeRound([0, h]);

    /*
    var y=null;

    if(log) {
	y = d3.scale.log()
            .domain([0, 100])
            .rangeRound([0, h]);
    } 
    else {
	y = d3.scale.linear()
            .domain([0, 100])
            .rangeRound([0, h]);
    }
*/

    var chart = d3.select(selector_name).append("svg")
        .attr("class", "chart")
        .attr("width", w * data.length - 1)
        .attr("height", h);

    // Create the bars
    chart.selectAll("rect")
        .data(data)
	.enter().append("rect")
        .attr("x", function(d, i) { return x(i) - .5; })
        .attr("y", function(d) { return h - y(d) - .5; })
        .attr("width", w)
        .attr("height", function(d) { return y(d); });

    // Create the lablels
    chart.selectAll("text")
	.data(data)
	.enter()
	.append("text")
	.text(function(d) {
	    return parseFloat(d).toPrecision(3);
	})
	.attr("class", "lumi_label")
	.attr("x", function(d, i) {
	    return i*w + 2;
	})
	.attr("y", function(d) {
	    return h - 5; //0.0; //h - (d * 4);
	})
	.attr("transform", "rotate(90)");
    
    // Create the axis lines
    chart.append("line")
        .attr("x1", 0)
        .attr("x2", w * data.length)
        .attr("y1", h - .5)
        .attr("y2", h - .5)
        .style("stroke", "#000");

    return;

    // Width and height
    var w = 500;
    var h = 100;

    var dataset = [
	[5, 20], 
	[480, 90], 
	[250, 50], 
	[100, 33], 
	[330, 95],
	[410, 12], 
	[475, 44], 
	[25, 67], 
	[85, 21], 
	[220, 88]
    ];

    //Create SVG element
    var svg = d3.select("body")
	.append("svg")
	.attr("width", w)
	.attr("height", h);

    svg.selectAll("circle")
	.data(dataset)
	.enter()
	.append("circle")
	.attr("cx", function(d) {
	    return d[0];
	})
	.attr("cy", function(d) {
	    return d[1];
	})
	.attr("r", function(d) {
	    return Math.sqrt(h - d[1]);
	});

    svg.selectAll("text")
	.data(dataset)
	.enter()
	.append("text")
	.text(function(d) {
	    return d[0] + "," + d[1];
	})
	.attr("x", function(d) {
	    return d[0];
	})
	.attr("y", function(d) {
	    return d[1];
	})
	.attr("font-family", "sans-serif")
	.attr("font-size", "11px")
	.attr("fill", "red");

}