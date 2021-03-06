
//derived from lineWithFocusChart.js
nv.models.flexibleRangesWithSelectionWithFocusChart = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  //focus is the first part of the graph
  //context the lower, smaller
  var ranges = nv.models.ranges()
    , ranges2 = nv.models.ranges()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , x2Axis = nv.models.axis()
    , y2Axis = nv.models.axis()
    , legend = nv.models.legend()
    , brushContext = d3.svg.brush()
    , brushFocus = d3.svg.brush()
    , selectionFocus = {start: 0, end: 0};
    ;

  var margin = {top: 30, right: 30, bottom: 30, left: 60}
    , margin2 = {top: 0, right: 30, bottom: 20, left: 60}
    , color = nv.utils.defaultColor() //TODO: less default? characteristic for each label and distinguishable
    , width = null
    , height = null
    , height2 = 100
    , x
    , y
    , x2
    , y2
    , showLegend = true
    , brushContextExtent = null
    , brushFocusExtent = null
    //no tooltips for now
    , tooltips = true
    , tooltip = function(key, x, y, e, graph) {
        return '<h3>' + key + '</h3>' +
               '<p>' +  y + ' at ' + x + '</p>'
      }
    , noData = "No Data Available."
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brushContext', 'brushFocus')
    ;

  xAxis
    .orient('bottom')
    .tickPadding(5)
    ;
  yAxis
    .orient('left')
    ;
  x2Axis
    .orient('bottom')
    .tickPadding(5)
    ;
  y2Axis
    .orient('left')
    ;
  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(ranges.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(ranges.y()(e.point, e.pointIndex)),
        content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, null, null, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight1 = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom - height2,

          availableHeight2 = height2 - margin2.top - margin2.bottom;

      //TODO: NOTE: FIXME: THIS is a giant gotcha, and a dirty hack (for anybody who might want to use this without angular-panes)
      if (availableWidth <= 0 || availableHeight1 <= 0 || availableHeight2 <= 0) {
        //if the sizes are fubared, just stop right here
        return;
      }

      chart.update = function() { chart(selection) };
      chart.container = this;

      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight1 / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Scales

      x = ranges.xScale();
      y = ranges.yScale();
      x2 = ranges2.xScale();
      y2 = ranges2.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap').append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-legendWrap');

      var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
      focusEnter.append('g').attr('class', 'nv-x nv-axis');
      focusEnter.append('g').attr('class', 'nv-y nv-axis');
      focusEnter.append('g').attr('class', 'nv-stackedWrap');
      focusEnter.append('g').attr('class', 'nv-x nv-brush nv-brushFocus');

      var contextEnter = gEnter.append('g').attr('class', 'nv-context');
      contextEnter.append('g').attr('class', 'nv-x nv-axis');
      contextEnter.append('g').attr('class', 'nv-y nv-axis');
      contextEnter.append('g').attr('class', 'nv-stackedWrap');
      contextEnter.append('g').attr('class', 'nv-brushBackground nv-brushContextBackground'); //additional classes to simplify selections
      contextEnter.append('g').attr('class', 'nv-x nv-brush nv-brushContext');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Legend

      if (showLegend) {
        legend.width(availableWidth);

        g.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight1 = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom - height2;
        }

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(0,' + (-margin.top) +')')
      }

      //------------------------------------------------------------


      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      //------------------------------------------------------------
      // Main Chart Component(s)

      ranges
        .color(
          data
            .map(function(d,i) {
              return d.color || color(d, i);
            })
            .filter(function(d,i) {
              return !data[i].disabled;
          })
        );
      ranges2
        .color(
          data
            .map(function(d,i) {
              return d.color || color(d, i);
            })
            .filter(function(d,i) {
              return !data[i].disabled;
          })
        );

      ranges
        .width(availableWidth)
        .height(availableHeight1)

      ranges2
        .width(availableWidth)
        .height(availableHeight2)

      g.select('.nv-context')
          .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')

      var contextrangesWrap = g.select('.nv-context .nv-stackedWrap')
          .datum(data.filter(function(d) { return !d.disabled }))

      d3.transition(contextrangesWrap).call(ranges2);

      //------------------------------------------------------------
      // Setup Main (Focus) Axes

      xAxis
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight1, 0);

      yAxis
        .scale(y)
        .ticks( availableHeight1 / 36 )
        .tickSize( -availableWidth, 0);

      g.select('.nv-focus .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + availableHeight1 + ')');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Context Brush

      brushContext
        .x(x2)
        .on('brush', onBrushContext);

      if (brushContextExtent) brushContext.extent(brushContextExtent);

      var brushContextBG = g.select('.nv-brushContextBackground').selectAll('g')
          .data([brushContextExtent || brushContext.extent()])

      var brushContextBGenter = brushContextBG.enter()
          .append('g');

      brushContextBGenter.append('rect')
          .attr('class', 'left')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', availableHeight2);

      brushContextBGenter.append('rect')
          .attr('class', 'right')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', availableHeight2);

      gBrushContext = g.select('.nv-brushContext')
          .call(brushContext);
      gBrushContext.selectAll('rect')
          //.attr('y', -5)
          .attr('height', availableHeight2);
      gBrushContext.selectAll('.resize').append('path').attr('d', resizePath);

      onBrushContext();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Focus Brush

      brushFocus
        .x(x)
        .on('brush', onBrushFocus);

      if (brushFocusExtent) brushFocus.extent(brushFocusExtent);

      gBrushFocus = g.select('.nv-brushFocus')
          .call(brushFocus);
      gBrushFocus.selectAll('rect')
          //.attr('y', -5)
          .attr('height', availableHeight1);
      gBrushFocus.selectAll('.resize').append('path').attr('d', resizePath);

      onBrushFocus();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Secondary (Context) Axes

      x2Axis
        .scale(x2)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight2, 0);

      g.select('.nv-context .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y2.range()[0] + ')');
      d3.transition(g.select('.nv-context .nv-x.nv-axis'))
          .call(x2Axis);

      y2Axis
        .scale(y2)
        .ticks( availableHeight2 / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-context .nv-y.nv-axis'))
          .call(y2Axis);

      g.select('.nv-context .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y2.range()[0] + ')');

      //------------------------------------------------------------


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      legend.dispatch.on('legendClick', function(d,i) {
        d.disabled = !d.disabled;

        if (!data.filter(function(d) { return !d.disabled }).length) {
          data.map(function(d) {
            d.disabled = false;
            wrap.selectAll('.nv-series').classed('disabled', false);
            return d;
          });
        }

        selection.transition().call(chart);
      });

      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      //============================================================


      //============================================================
      // Functions
      //------------------------------------------------------------

      // Taken from crossfilter (http://square.github.com/crossfilter/)
      function resizePath(d) {
        var e = +(d == 'e'),
            x = e ? 1 : -1,
            y = availableHeight2 / 3;
        return 'M' + (.5 * x) + ',' + y
            + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
            + 'V' + (2 * y - 6)
            + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
            + 'Z'
            + 'M' + (2.5 * x) + ',' + (y + 8)
            + 'V' + (2 * y - 8)
            + 'M' + (4.5 * x) + ',' + (y + 8)
            + 'V' + (2 * y - 8);
      }


      function updateBrushContextBG() {
        if (!brushContext.empty()) brushContext.extent(brushContextExtent);
        brushContextBG
            .data([brushContext.empty() ? x2.domain() : brushContextExtent])
            .each(function(d,i) {
              var leftWidth = x2(d[0]) - x.range()[0],
                  rightWidth = x.range()[1] - x2(d[1]);
              d3.select(this).select('.left')
                .attr('width',  leftWidth < 0 ? 0 : leftWidth);

              d3.select(this).select('.right')
                .attr('x', x2(d[1]))
                .attr('width', rightWidth < 0 ? 0 : rightWidth);
            });
      }

      function onBrushContext() {
        brushContextExtent = brushContext.empty() ? null : brushContext.extent();
        extent = brushContext.empty() ? x2.domain() : brushContext.extent();

        dispatch.brushContext({extent: extent, brush: brushContext});

        updateBrushContextBG();

        // Update Main (Focus)
        var focusrangesWrap = g.select('.nv-stackedWrap')
            .datum(
              data
              .filter(function(d) { return !d.disabled })
              .map(function(d,i) {
                var newValues = []

                var lastY = 0;
                var firstSetFlag = false //whether the first data point is set
                for (i in d.values) {
                    var xVal = ranges.x()(d.values[i],i);

                    // get the point closest to the left selection boundary
                    if (xVal < extent[0]) {
                        lastY = d.values[i].y
                    }

                    // add first (fake) point for new selection
                    if (!firstSetFlag && xVal > extent[0]) {
                        firstSetFlag = true;
                        newValues.push({x: extent[0], y: lastY})
                    }

                    // at the end, nobody cares for the following points
                    if (xVal > extent[1]) {
                        var id = i == 0 ? 0 : i-1
                        newValues.push({x: extent[1], y: d.values[id].y})
                        break
                    }

                    if (xVal >= extent[0] && xVal <= extent[1]) {
                        newValues.push(d.values[id])
                    }
                }

                return {
                  key: d.key,
                  values: //newValues
                  [{x:extent[0], y:0},{x:extent[1], y:5}]
                }

                /*
                return {
                  key: d.key,
                  values: d.values.filter(function(d,i) {
                    return ranges.x()(d,i) >= extent[0] && ranges.x()(d,i) <= extent[1];
                  })
                }
                */
              })
         );
        focusrangesWrap.call(ranges);


        // Update Main (Focus) Axes
        d3.transition(g.select('.nv-focus .nv-x.nv-axis'))
            .call(xAxis);
        d3.transition(g.select('.nv-focus .nv-y.nv-axis'))
            .call(yAxis);

        //update focus selection
        onBrushFocus();
      }

      function onBrushFocus() {
        brushFocusExtent = brushFocus.empty() ? null : brushFocus.extent();
        extent = brushFocus.empty() ? x.domain() : brushFocus.extent();

        dispatch.brushFocus({extent: extent, brush: brushFocus});

        if (extent == null) {
            selectionFocus.start = 0;
            selectionFocus.end = 0;
        } else {
            selectionFocus.start = extent[0];
            selectionFocus.end = extent[1];
        }
        chart.selectionCallback(selectionFocus.start,selectionFocus.end);
      }

      //============================================================


    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  //TODO
  /*
  lines.dispatch.on('elementMouseover.tooltip', function(e) {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  lines.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e);
  });

  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });
  */

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.legend = legend;
  chart.ranges = ranges;
  chart.ranges2 = ranges2;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  chart.x2Axis = x2Axis;
  chart.y2Axis = y2Axis;

  d3.rebind(chart, ranges, 'defined', 'isArea', 'size', 'xDomain', 'yDomain', 'forceX', 'forceY', 'interactive', 'clipEdge', 'clipVoronoi', 'id');

  // a function which is called with start and end time values (in seconds, according to the x axis)
  chart.selectionCallback = function(start,end) {}; //triggered when the selection changes

  chart.x = function(_) {
    if (!arguments.length) return ranges.x;
    ranges.x(_);
    ranges2.x(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return ranges.y;
    ranges.y(_);
    ranges2.y(_);
    return chart;
  };

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.margin2 = function(_) {
    if (!arguments.length) return margin2;
    margin2 = _;
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

  chart.height2 = function(_) {
    if (!arguments.length) return height2;
    height2 = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color =nv.utils.getColor(_);
    legend.color(color);
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.interpolate = function(_) {
    if (!arguments.length) return ranges.interpolate();
    ranges.interpolate(_);
    ranges2.interpolate(_);
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  // Chart has multiple similar Axes, to prevent code duplication, probably need to link all axis functions manually like below
  chart.xTickFormat = function(_) {
    if (!arguments.length) return xAxis.tickFormat();
    xAxis.tickFormat(_);
    x2Axis.tickFormat(_);
    return chart;
  };

  chart.yTickFormat = function(_) {
    if (!arguments.length) return yAxis.tickFormat();
    yAxis.tickFormat(_);
    y2Axis.tickFormat(_);
    return chart;
  };

  //============================================================

  return chart;
}
