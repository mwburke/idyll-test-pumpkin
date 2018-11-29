const React = require('react');
const D3Component = require('idyll-d3-component');
const d3 = require('d3');


class CustomD3Component extends D3Component {

  initialize(node, props) {
    var margin = {top: 30, right: 10, bottom: 10, left: 10};
    var width = props.width - margin.left - margin.right;
    var height = props.height - margin.top - margin.bottom;

    var x = d3.scalePoint().range([0, width]).padding(1),
        y = {};

    var line = d3.line(),
        axis = d3.axisLeft(),
        background,
        foreground;

    var dimensions = null;

    const svg = d3.select(node).append('svg');

    svg.style('width', width + margin.left + margin.right)
       .style('height', height+margin.top + margin.bottom);

    const svg_adjusted = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(props.data[0]).filter(function(d) {
      return d != "name" && (y[d] = d3.scaleLinear()
          .domain([5, 1])
          .range([height, 0]));
    }));

    // Add grey background lines for context.
    background = svg_adjusted.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(props.data)
      .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg_adjusted.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(props.data)
      .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    const g = svg_adjusted.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.brushY()
              .extent([[-10,0], [10,height]])
              .on("brush", brush)
              .on("end", brush)
              )
          })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

  // Returns the path for a given data point.
  function path(d) {
      return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
      var actives = [];
      svg.selectAll(".brush")
        .filter(function(d) {
              y[d].brushSelectionValue = d3.brushSelection(this);
              return d3.brushSelection(this);
        })
        .each(function(d) {
            // Get extents of brush along each active selection axis (the Y axes)
              actives.push({
                  dimension: d,
                  extent: d3.brushSelection(this).map(y[d].invert)
              });
        });

      var selected = [];
      // Update foreground to only display selected values
      foreground.style("display", function(d) {
          return actives.every(function(active) {
              let result = active.extent[0] <= d[active.dimension] && d[active.dimension] <= active.extent[1];
              if(result)selected.push(d);
              return result;
          }) ? null : "none";
      });

  }
  return svg.node();
  }

  update(props, oldProps) {
    return;
  }
}

module.exports = CustomD3Component;
