var svg
    , legend_g
    , polygons;
var chart = {}
    , names
    , legend;
//
var tip = d3.tip()
    .attr('class', 'd3-tip');
//
var quantize = d3.scale.quantize()
    .range(d3.range(15).map(function (i) {
        return "q" + i + "-15";
    }));
//
var formatter = d3.format(',.0f');
//




chart.formatter = function (_) {
    if (!arguments.length) return formatter;
    formatter = _;
    return chart;
};

chart.init = function (options) {
    var width = 300,
        height = 180,
        legend_height = 50;


    d3.json('data/kazakhstan_cities.geojson', function (error, data) {
        if (error) throw error;

        svg = d3.select("#region-chart").append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + (width) + " " + (height + legend_height))
            .attr("preserveAspectRatio", "xMidYMid");

        legend_g = svg.append("g")
            .attr("class", "legendQuant")
            .attr("transform", "translate(30," + height + ")");

        names = data.features.map(function (d) {
            return d.properties.name
        });

//            use to get center
//            var center = d3.geo.centroid(data);
//            console.log(center);
        var projection = d3.geo.mercator()
            .center([67.20008913353067, 48.36121980855291])
            .translate([width / 2, height / 2])
            .scale(370);

        var path = d3.geo.path()
            .projection(projection);

        polygons = svg.selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", 'q0-15')
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    });
};

    chart.update = function (moneyByRegion) {
        var max = d3.max(Object.keys(moneyByRegion), function (key) {
            return moneyByRegion[key]
        });
        // Hack to avoid zero domain

        if (!max) max = 1;
        quantize
            .domain([0, max]);

        // fill data with zeros for absent regions
        names.forEach(function (name) {
            if (!moneyByRegion[name]) moneyByRegion[name] = 0
        });

        tip.html(function (d) {
            return d.properties.name + '<br/><br/>' + formatter(moneyByRegion[d.properties.name])
        });

        polygons
            .attr("class", function (d) {
                var money = moneyByRegion[d.properties.name];
                return quantize(money)
            })
            .call(tip);
//            .append("title")
//            .text(function(d) {return d.properties.name + ' \n' + formatter(moneyByRegion[d.properties.name])});

        legend
            .scale(quantize)
            .labels([0, '', '', '', '', '', '', '', '', '', '', '', '', '', formatter(max)]);

        legend_g
            .call(legend);

        // Align '0' label to the start
        var first_label = legend_g.select('text.label');
        var transform = first_label.attr('transform').replace(/translate\(\d+,/, 'translate(0,');

        first_label
            .style('text-anchor', "start")
            .attr('transform', transform);
    };

    

