
nv.models.ranges = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 960
    , height = 500
    , color = nv.utils.defaultColor() // a function that computes the color
    , id = Math.floor(Math.random() * 100000) //Create semi-unique ID incase user doesn't selet one
    , getX = function(d) { return d.x } // accessor to get the x value from a data point
    , getY = function(d) { return d.y } // accessor to get the y value from a data point
    , clipEdge = false // if true, masks lines within x and y scale
    , x //can be accessed via chart.xScale()
    , y //can be accessed via chart.yScale()
    , scatter = nv.models.scatter()
    , dispatch =  d3.dispatch()
    ;

  scatter
    .size(2.2) // default size
    .sizeDomain([2.2,2.2]) // all the same size by default
    ;

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right,
          availableHeight = height - margin.top - margin.bottom,
          container = d3.select(this);

      //------------------------------------------------------------
      // Setup Scales

      x = scatter.xScale();
      y = scatter.yScale();

      //------------------------------------------------------------

      console.log(data)
      data = data.map(function(series, i) {
               series.values = series.values.map(function(d, j) {
                 //TODO
                 d.index = j;
                 d.stackedY = series.disabled ? 0 : getY(d,j);
                 return d;
               })
               return series;
             });

      var wrap = container.selectAll('g.nv-wrap.nv-ranges').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-ranges');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-rangesWrap');
      gEnter.append('g').attr('class', 'nv-scatterWrap');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------

      scatter
        .width(availableWidth)
        .height(availableHeight)
        //.x(getX)
        //.y(function(d) { return d.display.y + d.display.y0 })
        .forceY([0])
        .color(data.map(function(d,i) {
          return d.color || color(d, i);
        }).filter(function(d,i) { return !data[i].disabled }));


      var scatterWrap = g.select('.nv-scatterWrap')
          .datum(data.filter(function(d) { return !d.disabled }))

      //d3.transition(scatterWrap).call(scatter);
      scatterWrap.call(scatter);

      //------------------------------------------------------------

      var ranges = g.select('.nv-areaWrap').selectAll('rect')
          .data(function(d) { return d });

      ranges.enter().append('rect')
          .attr("x", function(d) {d.x})
          .attr("y", function(d) {d.y})
          .attr("height", function(d) {})

      ranges.exit()
          .remove();

      ranges
          .style('fill', function(d,i){ return d.color || color(d, i) })
          .style('stroke', function(d,i){ return d.color || color(d, i) });
      //ranges
      //    .attr('d', function(d,i) { return area(d.values,i) })
    });

    return chart;
  }

  //============================================================
  // Global getters and setters
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  //chart.bars = bars;

  d3.rebind(chart, scatter, 'interactive', 'size', 'xScale', 'yScale', 'zScale', 'xDomain', 'yDomain', 'sizeDomain', 'forceX', 'forceY', 'forceSize');

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = d3.functor(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = d3.functor(_);
    return chart;
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  //============================================================


  return chart;
}
