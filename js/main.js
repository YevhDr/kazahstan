$(document).ready(function () {

    // ---- Defining some custom events here

    // 1st step filter event
    $('#picker-year').on('change', function () {
        $(this).trigger('filter1-changed');
    });

    $('#picker-media-type').on('change', function () {
        $(this).trigger('filter1-changed');
    });

    $('#picker-region').on('change', function () {
        $(this).trigger('filter1-changed');
    });

    $('#pill1').on('show.bs.tab', function() {
        $(this).trigger('pill1-selected');
    });

    $('#pill2').on('show.bs.tab', function(e) {
        $(this).trigger('pill2-selected')
    });

    // -------

    var data;
    var state = {
        'picker-year': {},
        'picker-media-type': {},
        'picker-region': {},
        active_pill: 'media',
        selected_medias: [],
        selected_orgs: []
    };

    var activePill = function() {
        return state.active_pill=='media' ? $('#pill1-table') : $('#pill2-table');
    };

    var data_filtered;
    var data_nested;
//    var data_pill_page;

    var filter1 = function (o) {
        var years = state['picker-year'];
        var fit_year = 'all' in years ? true : o.year in years;

        return fit_year
            && o.type in state['picker-media-type']
            && o.region in state['picker-region'];
    };

    var areaFormatterGenerator = function(max) {
        var comma = /\,/g;
        var dot = /\./g;

        var basic = function(d) {return d3.format(',.1f')(d).replace(dot, ',').replace(',0', '')};

        if (max == 0) return basic;
        if (max >= 1000000000) return function(d) {return basic(d / 1000000000)};
        if (max >= 1000000) return function(d) {return basic(d / 1000000)};
        if (max >= 1000) return function(d) {return basic(d / 1000)};
        return basic;
    };

    var verbosedFormatter = function(d) {
        var comma = /\,/g;
        var dot = /\./g;
        var basic = function(d) {return d3.format(',.1f')(d).replace(dot, ',')};

        if (d == 0) return 0;
        if (d >= 1000000000) return basic(d / 1000000000) + " млрд";
        if (d >= 1000000) return basic(d / 1000000) + " млн";
        if (d >= 1000) return basic(d / 1000) + " тыс.";
        return basic(d);
    };

    // Same without redundant zero (101,0 -> 101)
    var verbosedNoZeroFormatter = function(d) {
        return (verbosedFormatter(d) + "").replace(',0', '');
    };

    var units = "тенге";
    var unitsFormatter = function(d) {return verbosedFormatter(d) + " " + units};
    var unitsNoZeroFormatter = function(d) {return verbosedNoZeroFormatter(d) + " " + units};

    // Init charts
    year_chart
        .area_chart(area_chart)
        .formatterGenerator(areaFormatterGenerator)
        .init({selector: ".area-chart", width: 225, height: 140});

    regions_chart
        .formatter(unitsNoZeroFormatter)
        .init({selector: ".regions-chart"});

    sankey_chart
        .formatter(unitsNoZeroFormatter)
        .maxNodes(20)
        .init({selector: ".sankey-chart"});

    total_chart
        .selector("#total-number")
        .formatter(verbosedFormatter);

    sankey_caption
        .selector("#sankey-caption");

    // -----------------------------------------------

    d3.csv("data.csv", function (error, json) {
        if (error) return console.warn(error);

        data = json;

        $('body').on('pill1-selected', function(e) {
            activePill().bootstrapTable("uncheckAll");
            if (state.active_pill == "media") return;
            state.active_pill = "media";
            updateNested(data_filtered);
            reddish();
        });

        $('body').on('pill2-selected', function(e) {
            activePill().bootstrapTable("uncheckAll");
            if (state.active_pill == "client") return;
            state.active_pill = "client";
            updateNested(data_filtered);
            violettish();
        });

        $('#pill1-table, #pill2-table').on('page-change.bs.table', function (e, number, size) {
            updateSankey();
            activePill().bootstrapTable("uncheckAll");
        });

        $('body').on('filter1-changed', function (e, dont_update) {
            var selected = $(e.target).find("option:selected")
                .toArray()
                .map(function (o) {return $(o).val()})
                .reduce(function (o, v, i) { //reducing to an object (set)
                    o[v] = true;
                    return o;
                }, {});
            state[e.target.id] = selected;
            if (!dont_update) updateFilter1();
        });

        // On check/uncheck single row
        // Check
        $("#pill1-table, #pill2-table").on('check.bs.table', function(e, row) {
            $('.close-div').remove();
            var td = activePill().find('tr.selected').find('td')[2];
            $(td).append("<div class='close-div'>&#10006</div>");

            updateGrantTableAndCharts(row);
            updateSankey(row);
            showGrants(row.values.v);
        });

        // Uncheck
        $("#pill1-table, #pill2-table").on('uncheck.bs.table', function(e, row) {
            $('.close-div').remove();
            updateGrantTableAndCharts(data_nested);
            updateSankey();
            hideGrants();
        });

        // Uncheck All
        $("#pill1-table, #pill2-table").on('uncheck-all.bs.table', function(e, row) {
            $('.close-div').remove();
            updateGrantTableAndCharts(data_nested);
            updateSankey();
            hideGrants();
        });

        // ----------------------------------------------------

        // Initial event triggering
        // Update only only on the last event
        $('#picker-year').trigger('filter1-changed', true);
        $('#picker-media-type').trigger('filter1-changed', true);
        $('#picker-region').trigger('filter1-changed');

        $('#pill1-table').trigger('pill1-selected');
    });

    function reddish() {
        $('.charts-container').removeClass("Violet");
        $('.charts-container').addClass("Red");
    }

    function violettish() {
        $('.charts-container').removeClass("Red");
        $('.charts-container').addClass("Violet");
    }

    function updateGrantTableAndCharts(nested_grants_data) {
        var single = !Array.isArray(nested_grants_data);

        if (single) nested_grants_data = [nested_grants_data];

        var grants_data = nested_grants_data.reduce(function(o, v, i) {
            Array.prototype.push.apply(o, v.values.v);
            return o;
        }, []);

        var years_d = years_data(grants_data);
        year_chart.update(years_d);
        regions_chart.update(regions(grants_data));

        var total_summ = d3.sum(years_d, function(d) {return +d.money});
        total_chart.update(total_summ);
    }

    function updateSankey(row) {
        var active_pill = activePill();
        var data = row ? [row] : active_pill.bootstrapTable('getData', true);

        var grants_data = data.reduce(function(o, v, i) {
            Array.prototype.push.apply(o, v.values.v);
            return o;
        }, []);

        var activeClass = state.active_pill == 'media' ? 'Red' : 'Violet';
        sankey_chart.redraw(grants_data, activeClass);
        if (row) sankey_caption.updateSingle(row.key, state.active_pill);
        else sankey_caption.updateRange(active_pill, state.active_pill);
    }

    function updateFilter1() {
        activePill().bootstrapTable('showLoading');
        data_filtered = data.filter(filter1);
        updateNested(data_filtered);
        hideGrants();
    }

    function updateNested(data_filtered) {
        var active_pill = activePill();
        active_pill.bootstrapTable('showLoading');
        data_nested = d3.nest()
            .key(function (d) {
                return d[state.active_pill];
            })
            .rollup(function(v) { return {v: v, sum: d3.sum(v, function(d) { return d.money; })} })
            .entries(data_filtered)
            .sort(function(a, b) {return d3.descending(a.values.sum, b.values.sum)})
            .map(function(d) {d.sum = d.values.sum; return d});


        active_pill.bootstrapTable('load', data_nested);
        active_pill.bootstrapTable('hideLoading');

        updateGrantTableAndCharts(data_nested);
        updateSankey();
    }

    function years_data(data) {
        var min = 2009;
        var max = 2016;
        var rollup = d3.nest()
            .key(function(d) {return d.year})
            .rollup(function(v) {return d3.sum(v, function(d) {return d.money})});

        var years_data = rollup
            .entries(data)
            .map(function (d) {
                return {year: +d.key, money: +d.values};
            });

        var years_set = rollup
            .map(data);

        var year = function(d) {return d.year};

        //Return as is if single year
        if (!('all' in state['picker-year'])) return years_data;

        // Use this to show only years presented in data
//        var min = d3.min(years_data, year);
//        var max = d3.max(years_data, year);

        // Else fulfill year gaps with zeros
        for (var i = min; i <= max; i++) {
            if (!(i in years_set)) years_data.push({year:i, money:0});
        }

        years_data.sort(function(a, b) {return a.year - b.year});
        return years_data;
    }

    // Returns a map of regions and money {"Region 1": 1000, ...}
    function regions(data) {
        var res =  data.reduce(function(o, v, i) {
            if (!o[v.region]) o[v.region] = +v.money;
            else o[v.region] += +v.money;
            return o;
        }, {});
        res["Республика Казахстан"] = 0;
        return res;
    }

    function hideGrants() {
        $('.grants-container').hide();
        $('#table-grants').bootstrapTable('load', []);
    }

    function showGrants(data) {
        $('#table-grants').bootstrapTable('load', data);
        $('.grants-container').show();
//        checkScrollBars();
    }

//    var checkScrollBars = function(){
//        console.log("changed");
//        var b = $('body');
//        var normalw = 0;
//        var scrollw = 0;
//        console.log(b.prop('scrollHeight'));
//        console.log(b.height());
//        if(b.prop('scrollHeight')>b.height()){
//
//            normalw = window.innerWidth;
//            scrollw = normalw - b.width();
//            $('.main-container').css({marginRight:'-'+scrollw+'px'});
//        }
//    }

    // Feature. Now we can click on sankey node and appropriate data record will be selected

    $(document).on('active-node-click', 'g.node', function(e, data) {
        var table = activePill();
        var options = table.bootstrapTable('getOptions');
        var page_data = table.bootstrapTable("getData", true);

        var idx = indexOfName(page_data, data.name) + (options.pageNumber - 1) * options.pageSize;
        table.bootstrapTable("check", idx);
    });

    function indexOfName(data, name) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].key == name) return i;
        }
    }
});

