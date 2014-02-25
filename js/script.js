document.getElementById("button").addEventListener("click", function(){
    plotModule.redraw(getDummyScore(), getDummyRole2());
}, false);

//Mini Library For Geometry and Trig Related Math
var GeoTrig = (function(){
    var mod={};
    
    //The Polygon constructor should be supplied with an object
    //containing a array of points or an object with a radius property
    //and sides property(number of sides).  There should be more than 2
    //points or more than 2 sides
    function Polygon(obj){
        var func;
        if (obj.points && obj.points instanceof Array && obj.points.length > 2 && !obj.sides && !obj.radius){
            func = function(i){ return obj.points[i] };
        }
        else if(typeof obj.radius === "number" && obj.sides && obj.sides > 2 && !obj.points){
            func = function(){ return obj.radius };
        }
        else{
            throw "Invalid arguments"
        }
        
        this.center = obj.center || {x: 0, y: 0};
        this.sides = obj.sides || obj.points.length;
        this.innerAngle = (2*Math.PI) / this.sides;
        this.points = [];
        for(var i=0; i < this.sides; i++){
            this.points.push({
                x:  this.center.x + func(i)*Math.cos((Math.PI/2) - (i * this.innerAngle)),
                y:  this.center.y + func(i)*Math.sin((Math.PI/2) - (i * this.innerAngle))
            });
        }
    }
    
    mod = {
        Polygon: {
            make: function(obj){ return new Polygon(obj) }
        }
    }
    return mod
})()

var plotModule = (function(GeoTrig){
    var plotModule={},
        plotWidth = 500,
        plotHeight = 500,
        plotCenter = {x: plotWidth/2, y: plotHeight/2},
        paddingX = 150,
        paddingY = 50,
        pointRadius = 4,
        canvas = d3.select("#canvas")
                    .append("svg:svg")
                    .attr({
                        width: plotWidth+(paddingX*2),
                        height: plotHeight+(paddingY*2)
                    }),
        xScale = d3.scale.linear().domain([0, 4]).range([plotWidth/2, plotWidth]),
        yScale = d3.scale.linear().domain([0, 4]).range([plotHeight/2, 0]),
        lineGen = d3.svg.line()
            .x(function(d) { return xScale(d.x) })
            .y(function(d) { return yScale(d.y) });

    //Helper function to align text correctly
    function determineTextAnchor(point){
        if(Math.abs(point.x) < 0.01 && point.x >= 0){
            return "middle"
        }
        else if(point.x > 0){
            return "start"
        }
        else{
            return "end"
        }
    }
    
    return plotModule = {
        init: function(userArr, roleArr){

            var outerPolygon = GeoTrig.Polygon.make({radius: 4, sides: userArr.length}),
                userScoreArr = userArr.map(function(elem){return elem.score}),
                roleScoreArr = roleArr.map(function(elem){return elem.score}),
                userCompetencyShape = GeoTrig.Polygon.make({points: userScoreArr}),
                roleCompetencyShape = GeoTrig.Polygon.make({points: roleScoreArr}),
                polygonGroup,
                plotGroup;

            plotGroup = canvas.append("svg:g")
                        .attr("transform", "translate("+paddingX+","+paddingY+")")
            
            var polygonsGroup = plotGroup.selectAll("path.line.web")
                        .data([outerPolygon.points,
                               GeoTrig.Polygon.make({radius: 3, sides: outerPolygon.sides}).points,
                               GeoTrig.Polygon.make({radius: 2, sides: outerPolygon.sides}).points,
                               GeoTrig.Polygon.make({radius: 1, sides: outerPolygon.sides}).points])
                        .enter().append("svg:g")

            polygonsGroup.append("svg:path")
                        .attr("class", "line web")
                        .attr("d", function(d){return lineGen(d) + "Z"});
            
            var competencyGroup = plotGroup.selectAll("path.line.competency")
                        .data([roleCompetencyShape.points, userCompetencyShape.points])
                        .enter().append("svg:g").attr("class", function(d,i){return i % 2 == 0 ? "role competency" : "user competency"});
            
            competencyGroup.append("svg:path")
                        .attr("d", function(d){return lineGen(d) + "Z"});
            
            competencyGroup.selectAll("circle")
                        .data(function(d){return d})
                        .enter()
                        .append("svg:circle")
                        .attr({
                            cx: function(d){return xScale(d.x)},
                            cy: function(d){return yScale(d.y)},
                            r: pointRadius
                        })

            var labelGroup = plotGroup.append("svg:g").attr("id", "labels")
            labelGroup.selectAll("text.score")
                        .data([1,2,3,4])
                        .enter().append("svg:text")
                        .text(function(d,i){ return d})
                        .attr({
                            class: "score",
                            x: xScale(0) - 10,
                            y: function(d){ return yScale(d) - 5}
                        });
            labelGroup.selectAll("text.competency")
                        .data(outerPolygon.points)
                        .enter().append("svg:text")
                        .text(function(d,i) { return userArr[i].name })
                        .attr({
                            class: "competency",
                            x: function(d){return xScale(d.x * 1.1)},
                            y: function(d){return yScale(d.y * 1.1)},
                            "text-anchor": function(d){ return determineTextAnchor(d);}
                        });
                                       
        },
        endAll: function(transition, context, callback){
            var n = 0;
            if(transition.empty()){
                callback.apply(context, arguments)
            }
            else{
                transition
                    .each(function(){++n})
                    .each("end", function(){ if(!--n){ callback.apply(context, arguments) }})
            }
        },
        redraw: function(userArr,roleArr){
            //Filter Input Arrays
            (function(){
                var indexes = [];
                
                roleArr.forEach(function(elem, index){
                    if(roleArr[index].score === null){
                        indexes.push(index);
                    }
                });
                
                for(var i = indexes.length-1; i >= 0; i--){
                    userArr.splice(indexes[i], 1);
                    roleArr.splice(indexes[i], 1);
                }

            })();

            var outerPolygon = GeoTrig.Polygon.make({radius: 4, sides: userArr.length}),
                userScoreArr = userArr.map(function(elem){return elem.score}),
                roleScoreArr = roleArr.map(function(elem){return elem.score}),
                userCompetencyShape = GeoTrig.Polygon.make({points: userScoreArr}),
                roleCompetencyShape = GeoTrig.Polygon.make({points: roleScoreArr});


            //Redraw labels
            var competencyLabels = d3.select("#labels").selectAll("text.competency")
                .data(outerPolygon.points)

            competencyLabels.exit()
                .transition()
                .style("opacity", 0)
                .remove()
                .call(this.endAll, this, function(){
                    competencyLabels
                        .text(function(d,i){return userArr[i].name})
                        .transition()
                        .attr({
                            x: function(d){return xScale(d.x * 1.1)},
                            y: function(d){return yScale(d.y * 1.1)},
                            "text-anchor": function(d){return determineTextAnchor(d)}})
                        .call(this.endAll, this, function(){
                            competencyLabels.enter()
                                .append("svg:text")
                                .text(function(d,i){return userArr[i].name})
                                .style("opacity", 0)
                                .attr({
                                    class: "competency",
                                    x: function(d){return xScale(d.x * 1.1)},
                                    y: function(d){return yScale(d.y * 1.1)},
                                    "text-anchor": function(d){return determineTextAnchor(d)}
                                }).transition().style("opacity", 1)
                        })
                    //Redraw Webs
                    var shapeGroup = d3.selectAll(".line.web")
                        .data([outerPolygon.points,
                                GeoTrig.Polygon.make({sides: outerPolygon.sides, radius: 3}).points,
                                GeoTrig.Polygon.make({sides: outerPolygon.sides, radius: 2}).points,
                                GeoTrig.Polygon.make({sides: outerPolygon.sides, radius: 1}).points
                               ])
                        .transition()
                        .attr("d", function(d){ return lineGen(d) + "Z"; });
                  
                    //Redraw Role
                    var roleGroup = d3.selectAll(".competency path")
                        .data([roleCompetencyShape.points, userCompetencyShape.points])
                        .transition()
                        .attr("d", function(d){return lineGen(d) + "Z"});
                    
                    //Redraw Circle
                    var circleGroup = d3.selectAll("g.competency")
                                        .data([roleCompetencyShape.points, userCompetencyShape.points])
                                        .selectAll("circle")
                                        .data(function(d){return d});
                    
                    circleGroup.transition().
                                attr({
                                    cx: function(d){return xScale(d.x)},
                                    cy: function(d){return yScale(d.y)},
                                    r: pointRadius
                                });

                    circleGroup.enter()
                                .append("svg:circle")
                                .attr({
                                    cx: function(d){return xScale(d.x)},
                                    cy: function(d){return yScale(d.y)},
                                    r: pointRadius
                                });

                    circleGroup.exit().remove();
                });

            debugText = d3.selectAll("#data > div").data([userArr, roleArr])
                        .selectAll("p")
                        .data(function(d){return d})

            debugText.text(function(d){return d.name  + ":" + d.score})

            debugText.enter().append("p")
                 .text(function(d){return d.name  + ":" + d.score})

            debugText.exit().remove();
        }
    }
})(GeoTrig);
plotModule.init(getDummyScore(), getDummyRole())

function getDummyScore(){
    return [
        {
            name: "Magic",
            score: 1
        },
        {
            name: "Agility",
            score: 4
        },
        {
            name: "Strength",
            score: 2
        },
        {
            name: "Luck",
            score: 3
        },
        {
            name: "Focus",
            score: 4
        },
        {
            name: "Songwriting",
            score: 2
        },
        {
            name: "Cooking",
            score: 4
        },
        {
            name: "Yelling",
            score: 3
        },
        {
            name: "Honesty",
            score: 2
        }]
}
function getDummyRole(){
    return [
        {
            name: "Consumers and Markets",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Product Strategy",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Market Execution",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Analysis",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Finances",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Clinical Insights",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Market Access",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Regulatory, Legal, and Compliance",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Lifecycle Management",
            score: randomIntFromInterval(1, 4)
        }]
}
function getDummyRole2(){
    return [
        {
            name: "Magic",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Agility",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Luck",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Analysis",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Focus",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Songwriting",
            score: randomIntFromInterval(1, 4)
        },
        {
            name: "Cooking",
            score: Math.random() >= 0.5 ? randomIntFromInterval(1, 4) : null
        },
        {
            name: "Yelling",
            score: Math.random() >= 0.5 ? randomIntFromInterval(1, 4) : null
        },
        {
            name: "Honesty",
            score: Math.random() >= 0.5 ? randomIntFromInterval(1, 4) : null
        }]
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}