var width = window.innerWidth * 0.8,
    height = window.innerHeight * 0.8;



/*--------------- Варіант # 1 з намальованою svg картою Казахстану----------------------------*/


d3.json("data/kazakhstan_QGIS.geojson", function (data) {

    d3.xml("img/map_clear.svg").mimeType("image/svg+xml").get(function (error, xml) {
        if (error) {
            throw error
        }

        d3.select("#map").node().appendChild(xml.documentElement);


        var svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);

        var path = svg.selectAll("path")
            .attr("class", "regions-chart")
            .on("mouseover", function (d) {
                d3.select(this).style('cursor', 'pointer');//
            })
            .on('mouseout', function (d) {
                d3.select(this).style('cursor', 'default');

            })
            .on("click", testFun); //по кліку відкриваємо вікно і генеруємо картку

        //ПРОБЛЕМА!!!!!
        // polygon.getBBox() некоректно отримує висоту, ширину та x/y координати полігона
        svg.selectAll(".regions-chart")
            .each(function () {
                d3.select(this)
                    .datum(function () {
                        var polygon = this; //отримується коректно
                        var polygonParent = this.parentNode;
                        var gId = this.id;
                        var bbox = polygon.getBoundingClientRect();
                        // alert(gId);
                        return data.features
                            .filter(function (d) {
                                if (d.properties.NAME_1 === gId){
                                    // alert(d.properties.NAME_1 + gId);
                                    d3.select(polygonParent)
                                        .append('g')
                                        // .attr("transform", function (d) {
                                        //  return "translate(" + bbox.x + bbox.y  + ")";
                                        //  })
                                        .attr('x', 400000)
                                        .attr('y', 400000)
                                        .attr("class", "label")
                                        .append('text')
                                        .text(d.properties.VARNAME_1);
                                }
                            })
                    })
                });
    });

});


/*--------------- Варіант # 2 з geojson  картою Казахстану ----------------------------*/
//
// var svg = d3.select("#map").append("svg")
//     .attr("width", width)
//     .attr("height", height);
//
// d3.json("data/kazakhstan_QGIS.geojson", function (data) {
//     var center = d3.geo.centroid(data);
//     var scale = window.innerWidth;
//     var offset = [width / 2, height / 2];
//     var projection = d3.geo.mercator().scale(scale).center(center)
//         .translate(offset);
//
//
//     var path = d3.geo.path()
//         .projection(projection);
//
//     // svg.append('image')
//     //     .attr('src', 'img/map_clear.svg');
//
//     svg.selectAll("path") // selects path elements, will make them if they don't exist
//         .data(data.features) // iterates over geo feature
//         .enter() // adds feature if it doesn't exist as an element
//         .append("path") // defines element as a path
//         .attr("d", path) // path generator translates geo data to SVG
//         .attr("class", "regions-chart")//
//         .on("mouseover", function (d) {
//             d3.select(this).style('fill', 'green');//
//         })
//         .on('mouseout', function (d) {
//             d3.select(this).style('fill', '#ffd400');
//         })
//         .on("click", testFun); //по кліку відкриваємо вікно і генеруємо картку
//
//     var label = svg.selectAll("text")
//         .data(data.features)
//         .enter()
//         .append("g")
//         .attr("class", "label")
//         .attr("transform", function (d) {
//             return "translate(" + path.centroid(d) + ")";
//         });
//
//
//     label.append('text')
//         .each(function (d) { //.each не потребує return
//             var first = d.properties.VARNAME_1.split("-", 2);//якщо назва має дефіс, то переносимо на два рядки
//             for (i = 0; i < first.length; i++) {
//                 d3.select(this).append("tspan")
//                     .text(first[i])
//                     .attr("dy", i ? "1.2em" : 0)
//                     .attr("x", 0)
//                     .attr("text-anchor", "middle");
//             }
//         });
// });
// end of Варіант # 2



//створюємо набір даних з усіма варіантами карток, картинок до них і вартістю
var cardCases = [
    {type: "квартиры", image: "img/appartment.png", price: 9000000, unit: "шт"},
    {type: "школы", image: "img/school.png", price: 9000000, unit: "шт"},
    {type: "пенсии", image: "img/pension.png", price: 23689, unit: "шт"},
    {type: "золотые медали на олимпиаде", image: "img/medal.png", price: 9000000, unit: "шт"},
    {type: "дороги", image: "img/road.png", price: 9000000, unit: "км"},
    {type: "трансплантаций сердца", image: "img/heart.png", price: 9000000, unit: ""},
    {type: "выплаты на новорожденного", image: "img/bitth_allowance.png", price: 9000000, unit: ""},
    {type: "уголь", image: "img/coal.png", price: 9000000, unit: "т"}
];

//функція, що виконується по кліку на область карти
var testFun = function (d) {
    d3.select("#overlay").style("display", "block");
    var cont1 = d3.select("#block_red"); //змінна для назви ЗМІ
    var cont2 = d3.select("#block_yellow1"); // змінна для суми
    
    // котейнери для випадкових карток
    var cont3 = d3.select("#block_purple");
    var cont4 = d3.select("#block_green");
    var cont5 = d3.select("#block_blue");
    var sum = d3.select("div#block_yellow1 > p#sum") // сума фінансування видання
        .text();
    sum = sum.replace(/\s/g, '');


    //обираємо три випадкових порівння для картки з даних cardCases
    var rand3 = cardCases[Math.floor(Math.random() * cardCases.length)];
    var rand4 = cardCases[Math.floor(Math.random() * cardCases.length)];
    while(rand4.type === rand3.type) {
       rand4 = cardCases[Math.floor(Math.random() * cardCases.length)];
    }
    var rand5 = cardCases[Math.floor(Math.random() * cardCases.length)];
    while(rand5.type === rand4.type || rand5.type === rand3.type) {
        rand5 = cardCases[Math.floor(Math.random() * cardCases.length)];
    }
   
    
    


    //додаємо random картку в першу колонку
    cont3.selectAll('h4').remove();
    cont3.selectAll('img').remove();
    cont3.selectAll('p').remove();
    cont3.append('h4')
        .attr('class', 'centered')
        .html(function () {
            return rand3.type;
        });
    cont3.append('img')
        .attr('id', 'pic1')
        .attr('src', function () {
            return rand3.image;
        });
    cont3.append('p')
        .attr('class', 'price')
        .html(function () {
            return "x " + Math.round(sum / rand3.price); //сума фінансування поділена на вартість послуги
        });

    //додаємо random картку в другу колонку
    cont4.selectAll('h4').remove();
    cont4.selectAll('img').remove();
    cont4.selectAll('p').remove();
    cont4.append('h4')
        .attr('class', 'centered')
        .html(function () {
            return rand4.type;
        });
    cont4.append('img')
        .attr('id', 'pic2')
        .attr('src', function () {
            return rand4.image;
        });
    cont4.append('p')
        .attr('class', 'price')
        .html(function () {
            return "x " + Math.round(sum / rand4.price);
        });


    //додаємо random картку в третю колонку
    cont5.selectAll('h4').remove();
    cont5.selectAll('img').remove();
    cont5.selectAll('p').remove();
    cont5.append('h4')
        .attr('class', 'centered')
        .html(function () {
            return rand5.type;
        });
    cont5.append('img')
        .attr('id', 'pic3')
        .attr('src', function () {
            return rand5.image;
        });
    cont5.append('p')
        .attr('class', 'price')
        .html(function () {
            return "x " + Math.round(sum / rand5.price);
        });
}; //end of testFun function


//закриваємо popup вікно
d3.select(".cross").on("click", function (d) {
    d3.select("#overlay").style("display", "none");
});


Array.prototype.contains = function (v) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === v) return true;
    }
    return false;
};

//
// var rand = [];
// rand.push("Нерелігійні організації");
// data.forEach(function (d, i) {
//     d.orgs.forEach(function (k, j) {
//         if (!cs.contains(k.section)) {
//             cs.push(k.section);
//         }
//     })
// });
