/*
The purpose of this demo is to demonstrate how multiple charts on the same page
can be linked through DOM and Highcharts events and API methods. It takes a
standard Highcharts config with a small variation for each data set, and a
mouse/touch event handler to bind the charts together.
*/


/**
 * In order to synchronize tooltips and crosshairs, override the
 * built-in events with handlers defined on the parent element.
 */
['mousemove'].forEach(function (eventType) {
    document.getElementById('timeline').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event;

            for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                chart = Highcharts.charts[i];
                if (chart==null || chart.renderTo==null){
                    continue;
                }
                // Find coordinates within the chart
                if (chart.renderTo!==wordCloud){
                  event = chart.pointer.normalize(e);
                  point = chart.series[0].searchPoint(event, true);
                }
                // Get the hovered point
                if (point) {
                    if (chart.renderTo.id == "timeline"){
                      var data = worldmap[point.id];
                      geomap.setTitle({'text':timeline_dict[point.x][0]+' (Original Released Box Office)'});
                      geomap.series[0].update({'data':data});
                      var data_scatter = scatterGDP[point.id];
                      scatter.update({series: data_scatter});

                      lineChart.series[0].setData(getRateLine(point.id));
                      wordCloud.series[0].update({'data':wordCloudData[point.id]});
                      point.highlight(e);
                    }
                    
                }

            }
        }
    );
});


/**
 * Override the reset function, we don't need to hide the tooltips and
 * crosshairs.
 */
Highcharts.Pointer.prototype.reset = function () {
    return undefined;
};

/**
 * Highlight a point by showing tooltip, setting hover state and draw crosshair
 */
Highcharts.Point.prototype.highlight = function (event) {
    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    this.series.chart.tooltip.refresh(this); // Show the tooltip
};

/**
 * Synchronize zooming through the setExtremes event handler.
 */
function syncExtremes(e) {
    var thisChart = this.chart;

    if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
        Highcharts.each(Highcharts.charts, function (chart) {
            if (chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(
                        e.min,
                        e.max,
                        undefined,
                        false,
                        { trigger: 'syncExtremes' }
                    );
                }
            }
        });
    }
}

function getRateLine(year){
  var currentData = []
  for(var i=2005;i<=2015;i++){
    if (i <=parseInt(year)){
      currentData.push(parseFloat(dataset[i]['suicide_rate']));
    }
    else{
      currentData.push(null);
    }
  }
  return currentData;
}



var timeline = {
    chart: {
      zoomType: 'x',
      type: 'timeline'
    },
    xAxis: {
      type: 'datetime',
      visible: false,
      labels: {
        format: '{value:%Y}'
      },
    },
    yAxis: {
      gridLineWidth: 1,
      title: null,
      labels: {
        enabled: false
      }
    },
    legend: {
      enabled: false
    },
    credits:{
        enabled: false,
    },
    title: {
      text: "Timeline For Overal Suicide Rate"
    },
    subtitle: {
        text: 'World\'s Overall Suicide Rate From 2005 To 2015'
    },
    tooltip: {
      enabled: false,
    },
    series: [{
      dataLabels: {
        allowOverlap: false,
        formatter: function(){
              var date = Highcharts.dateFormat('%Y',this.x);
              // var rate = this.point.label
              return '<span style="color:'+this.point.color+'">● </span><span style="font-weight: bold;" > ' +
                    date+'</span><br/>'+
                    '<span style="font-weight: normal; font-size: 6pt;" > '+'Suicide Rate: <b>'+(this.point.label*100).toFixed(3)+"‱" + "</b></span>";
        }
      },
      marker: {
        symbol: 'circle'
      },
      data: [],
    }]
  }

var dataset = {};
var timeline_dict = {};
var worldmap = {};
var scatterGDP = {};
var wordCloudData = {};
Highcharts.ajax({
    url:'./dataset1.json',
    dataType:'text',
    success: function(activity){
        activity = JSON.parse(activity);
        dataset = activity[0];
        timeline_data = [];
        timelineid = Object.keys(dataset);
        for (i =0;i<timelineid.length;i++){
            currentYear = dataset[timelineid[i]];
            year = currentYear['year'];
            date = new Date (year);
            if (timeline_dict.hasOwnProperty(date)==false){
                timeline_dict[date] = [];
            }
            year_dict = {};
            title = currentYear['suicide_rate'];
            if (timeline_dict[date].includes(title)==false){
                timeline_dict[date].push(title);
            }
            year_dict['x'] = date;
            year_dict['name'] = title;
            year_dict['label'] = title;
            year_dict['id'] = timelineid[i];
            timeline_data.unshift(year_dict);
        }
        timeline.series[0].data = timeline_data;
        Highcharts.chart('timeline',timeline);

        country_orig = activity[1];
        country_year = Object.keys(country_orig);
        for (i = 0;i<country_year.length;i++){
            info = country_orig[country_year[i]];
            currCountries = Object.keys(info);
            countries = [];
            countries_g = [];
            sum_x = 0;
            sum_y = 0;
            sum_xy = 0;
            sum_xx = 0;
            sum_yy = 0;
            n = currCountries.length;
            max_d = 0;
            for (j = 0;j<89;j++){
                if (j<n){
                  first_val = parseFloat(info[currCountries[j]][0]);
                  second_val = parseFloat(info[currCountries[j]][1]);
                  sum_x += second_val;
                  sum_y += first_val;
                  sum_xy += first_val*second_val;
                  sum_xx += second_val*second_val;
                  sum_yy += first_val*first_val;
                  country_s = {};
                  country_s['name'] = currCountries[j];
                  country_s['value'] = first_val;
                  countries.push(country_s);
                  country_g = {};
                  country_g['name'] = currCountries[j];
                  country_g['data'] = [[second_val,first_val]];
                  countries_g.push(country_g);
                  if (second_val > max_d){
                    max_d = second_val;
                  }
                }
                else{
                  countries_g.push({});
                }
            }
            slope = (n * sum_xy - sum_x * sum_y) / (n *sum_xx - sum_x * sum_x);
            intercept = (sum_y - slope * sum_x)/n;
            var last = {'type': 'line', 'color':'#000000','name': 'Regression Line',data:[[0,intercept],[max_d,max_d*slope+intercept]],'enableMouseTracking': false,'marker': {
              'enabled': false},'states': {'hover': {'lineWidth':2}}};
            countries_g.push(last);
            worldmap[country_year[i]] = countries;
            scatterGDP[country_year[i]] = countries_g;
        }
        wordCloudData = activity[2];
      }
    
});



geomap = new Highcharts.mapChart('geomap', {
    chart: {
      map: 'custom/world',
    },
    title: {
        text: 'Box Office of Original Release Across the World',
        useHTML: true,
      },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'bottom'
      }
    },
    subtitle:{
        text: "",
        useHTML : true,
    },
    credits:{
        enabled: false,
    },
    colorAxis:{
        minColor: '#ffb3b3',
        maxColor: '#900000',
        labels:{
          step: 10,
        }
    },
    series: [{
      data: [],
      joinBy: ['name', 'name'],
      name: 'Box Office',
      states: {
        hover: {
          color: '#a4edba'
        }
      }
    }]
});


lineChart = Highcharts.chart('lineChart', {

  title: {
      text: 'hellloooooooo'
  },
  credits:{
    enabled: false,
  },
  subtitle: {
      text: 'Source: thesolarfoundation.com'
  },
  xAxis:{
    categories:['2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015']
  },
  yAxis: {
      title: {
          text: 'Suicide Rate (‱)'
      },
      labels: {
        formatter: function(){
                    return (this.value*100).toFixed(3)+"‱"
        }
        
    },
      min : 0.011,
      max: 0.0136
  },
  legend: {
      layout: 'vertical',
      align: 'center',
      verticalAlign: 'bottom'
  },
  tooltip: {
    headerFormat: '<b>Year:</b> <span style= "color: #ff0000"> {point.x} </span><br>',
    pointFormatter: function(){
      return '<span style="font-weight: normal; font-size: 6pt;" > '+'Suicide Rate: <b>'+(this.y*100).toFixed(3)+"‱" + "</b></span>"

    }
},

  series: [{name:'suicide_rate',data:[0,0,0,0,0,0,0,0,0,0,0]}],

  responsive: {
      rules: [{
          condition: {
              maxWidth: 500
          },
          chartOptions: {
              legend: {
                  layout: 'horizontal',
                  align: 'center',
                  verticalAlign: 'bottom'
              }
          }
      }]
  }

});

scatter = Highcharts.chart('scatter', {
  chart: {
      type: 'scatter',
      zoomType: 'xy'
  },
  accessibility: {
      description: 'A scatter plot compares the height and weight of 507 individuals by gender. Height in centimeters is plotted on the X-axis and weight in kilograms is plotted on the Y-axis. The chart is interactive, and each data point can be hovered over to expose the height and weight data for each individual. The scatter plot is fairly evenly divided by gender with females dominating the left-hand side of the chart and males dominating the right-hand side. The height data for females ranges from 147.2 to 182.9 centimeters with the greatest concentration between 160 and 165 centimeters. The weight data for females ranges from 42 to 105.2 kilograms with the greatest concentration at around 60 kilograms. The height data for males ranges from 157.2 to 198.1 centimeters with the greatest concentration between 175 and 180 centimeters. The weight data for males ranges from 53.9 to 116.4 kilograms with the greatest concentration at around 80 kilograms.'
  },
  title: {
      text: 'Height Versus Weight of 507 Individuals by Gender'
  },
  subtitle: {
      text: 'Source: Heinz  2003'
  },
  xAxis: {
      title: {
          enabled: true,
          text: 'GDP per capita'
      },
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true,
      min:0,

  },
  yAxis: {
      title: {
          text: 'suicide rate'
      },
  },
  credits:{
    enabled: false,
  },
  legend: {
      enabled: false,
  },
  plotOptions: {
      scatter: {
          marker: {
              radius: 5,
              states: {
                  hover: {
                      enabled: true,
                      lineColor: 'rgb(100,100,100)'
                  }
              }
          },
          states: {
              hover: {
                  marker: {
                      enabled: false
                  }
              }
          },
          tooltip: {
              headerFormat: '<b>{series.name}</b><br>',
              pointFormat: '{point.x} cm, {point.y} kg'
          }
      }
  },
  series: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    {}, {}, {}, {},{}],
});

wordCloud = Highcharts.chart('wordCloud', {
    series: [{
      type: 'wordcloud',
      data: [],
      name: 'Occurrences'
  }],
  credits:{
    enabled: false,
},
    title: {
        text: 'Wordcloud of Lorem Ipsum'
    }
});