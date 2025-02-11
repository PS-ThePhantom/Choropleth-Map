document.addEventListener("DOMContentLoaded", () => {
  const urls = [
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json",
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
  ];

  Promise.all(urls.map((url) => fetch(url).then((res) => res.json())))
    .then(([data1, data2]) => {
      displayMap(data1, data2);
    })
    .catch((err) => {
      console.log("An error occurred: ", err);
    });
});

const displayMap = (educationalData, countyData) => {
  const chart = {
    size: {
      width: 1500,
      height: 900
    },
    padding: {
      top: 100,
      left: 60,
      bottom: 60,
      right: 100
    }
  };

  const svg = d3
    .select("div")
    .append("svg")
    .attr("width", chart.size.width)
    .attr("height", chart.size.height)
    .style("box-shadow", "0 0 10px 5px grey")
    .style("border-radius", "10px");

  svg
    .append("text")
    .attr("id", "title")
    .attr("x", chart.size.width / 2)
    .attr("y", chart.padding.top / 2 - 10)
    .attr("text-anchor", "middle")
    .text("United States Educational Attainment")
    .style("font-size", "40px")
    .style("font-weight", "bold");

  svg
    .append("text")
    .attr("id", "description")
    .attr("x", chart.size.width / 2)
    .attr("y", chart.padding.top / 2 + 15)
    .attr("text-anchor", "middle")
    .text(
      "Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)"
    )
    .style("font-size", "20px");

  const legendColors = [
    "#e5f5e0",
    "#c7e9c0",
    "#a1d99b",
    "#74c476",
    "#41ab5d",
    "#238b45",
    "#006d2c",
    "#00441b"
  ];
  const minPercentage = Math.floor(
    d3.min(educationalData, (d) => d.bachelorsOrHigher)
  );
  const maxPercentage = Math.ceil(
    d3.max(educationalData, (d) => d.bachelorsOrHigher)
  );
  const range = maxPercentage - minPercentage;
  const percentStep = Math.ceil(range / legendColors.length);
  const legendRectHeight =
    (chart.size.height - chart.padding.top - chart.padding.bottom) /
    legendColors.length;
  const legendRectWidth = 20;
  const legendRanges = d3.range(
    minPercentage,
    maxPercentage + percentStep,
    percentStep
  );

  const tooltipWidth = 120;
  const tooltip = d3
    .select("div")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(250, 250, 250, 85%)")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("width", tooltipWidth + "px")
    .style("text-align", "center")
    .style("box-shadow", "0 0 5px 2px grey");

  const projection = d3.geoIdentity().fitExtent(
    [
      [chart.padding.left, chart.padding.top],
      [
        chart.size.width - chart.padding.right,
        chart.size.height - chart.padding.bottom
      ]
    ],
    topojson.feature(countyData, countyData.objects.counties)
  );

  const path = d3.geoPath().projection(projection);
  const counties = topojson.feature(countyData, countyData.objects.counties).features;
  const states = topojson.feature(countyData, countyData.objects.states).features;

  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(counties)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const result = educationalData.find((edu) => edu.fips === d.id);
      return result
        ? legendColors[
        Math.floor((result.bachelorsOrHigher - minPercentage) / percentStep)
        ]
        : "#ccc";
    })
    .attr("stroke", "#fff")
    .attr("class", "county")
    .attr(
      "data-fips",
      (d) => educationalData.find((edu) => edu.fips === d.id).fips
    )
    .attr(
      "data-education",
      (d) => educationalData.find((edu) => edu.fips === d.id).bachelorsOrHigher
    )
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      const result = educationalData.find((edu) => edu.fips === d.id);
      tooltip
        .style("visibility", "visible")
        .html(
          `County: ${result.area_name}<br>State: ${result.state}<br>Bachelor's or Higher: ${result.bachelorsOrHigher}%`
        )
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px")
        .attr("data-education", result.bachelorsOrHigher);
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  svg
    .append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(states)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 1);

  const legendScale = d3
    .scaleLinear()
    .domain([minPercentage, minPercentage + percentStep * legendColors.length])
    .range([chart.size.height - chart.padding.bottom, chart.padding.top]);

  const legendAxis = d3
    .axisRight(legendScale)
    .tickValues(legendRanges)
    .tickFormat((d) => d + "%");

  svg
    .append("g")
    .attr("id", "legend-axis")
    .attr(
      "transform",
      "translate(" + (chart.size.width - chart.padding.right / 2) + ",0)"
    )
    .call(legendAxis);

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      "translate(" + (chart.size.width - chart.padding.right / 2) + ",0)"
    );

  legend
    .selectAll("rect")
    .data(legendColors)
    .enter()
    .append("rect")
    .attr("x", 0 - legendRectWidth)
    .attr("y", (d, i) => legendScale(minPercentage + (i + 1) * percentStep))
    .attr("width", legendRectWidth)
    .attr("height", legendRectHeight)
    .attr("fill", (d) => d)
    .attr("stroke", "black");
};
