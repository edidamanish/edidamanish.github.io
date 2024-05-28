var categoryCountByPark = {};
var plantSpeciesCountByPark = {};
var categoryColorScale;
var parksDataWhole;
var parksByState;
var uniqueCategoriesArray;

var mapSvg;
var stateOverlaySvg;
var barChartOverlay;
var hasIntructionBox2BeenShown = false;
var hasIntructionBox3BeenShown = false;

var hasStateBeenClicked = false;
var hasFlowerBeenClicked = false;

window.addEventListener("DOMContentLoaded", async (event) => {
  await loadSpeciesData();
  await loadParksData();
  updateInfoChartContent();
  await loadMap();
  await populateNationalParkCoordinates();
  listenToStateOverlayClicks();
  drawLegends();
  hasStateBeenClicked = false;
  hasFlowerBeenClicked = false;
  hasIntructionBox2BeenShown = false;
  hasIntructionBox3BeenShown = false;
});

function listenToStateOverlayClicks() {
  document
    .getElementById("overlay")
    .addEventListener("click", function (event) {
      if (stateOverlaySvg) {
        if (!stateOverlaySvg.node().contains(event.target)) {
          updateTopRightTextBox("");
          if (isReducedStateOverlay) {
            hideOverlay2();
            increaseSizeofStateOverlay();
          } else {
            hideOverlay();
          }
        }
      }
    });
}

function drawLegends() {
  drawForestLegend();
  drawMinAndMaxAcreaImageSvg();
  drawMinAndMaxFlowerLegend();
  makeAnimalLegend();
}

async function loadMap() {
  const res = await fetch("../data/us-states.json");
  const mapJson = await res.json();
  map(mapJson);
}

function getProjection() {
  const projection = d3
    .geoAlbersUsa()
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
    .scale(1300);

  return projection;
}

async function loadSpeciesData() {
  try {
    const speciesData = await d3.csv("../data/species.csv", function (d) {
      return {
        speciesId: d["Species ID"],
        parkName: d["Park Name"],
        category: d["Category"],
        order: d["Order"],
        family: d["Family"],
      };
    });

    const excludedCategoryList = [
      "Vascular Plant",
      "Nonvascular Plant",
      "Fungi",
      "Algae",
    ];

    const plantCategoryList = ["Vascular Plant", "Nonvascular Plant"];

    const filteredSpeciesData = speciesData.filter(
      (species) => !excludedCategoryList.includes(species.category)
    );

    const filteredPlantSpeciesData = speciesData.filter((species) =>
      plantCategoryList.includes(species.category)
    );
    const uniqueCategories = new Set(
      filteredSpeciesData.map((species) => species.category)
    );

    uniqueCategoriesArray = Array.from(uniqueCategories);
    categoryColorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(uniqueCategoriesArray);

    const speciesByPark = filteredSpeciesData.reduce((acc, species) => {
      const { parkName } = species;
      if (!acc[parkName]) {
        acc[parkName] = [];
      }
      acc[parkName].push(species);
      return acc;
    }, {});

    const plantSpeciesByPark = filteredPlantSpeciesData.reduce(
      (acc, species) => {
        const { parkName } = species;
        if (!acc[parkName]) {
          acc[parkName] = [];
        }
        acc[parkName].push(species);
        return acc;
      },
      {}
    );

    function countCategoriesForPark(parkName, speciesArray) {
      const categoryCounts = speciesArray.reduce((counts, species) => {
        const { category } = species;
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {});
      return categoryCounts;
    }

    for (const [parkName, speciesArray] of Object.entries(plantSpeciesByPark)) {
      plantSpeciesCountByPark[parkName] = speciesArray.length || 0;
    }

    for (const [parkName, speciesArray] of Object.entries(speciesByPark)) {
      const categoryCounts = countCategoriesForPark(parkName, speciesArray);
      categoryCountByPark[parkName] = categoryCounts;
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function loadCategoryDonutChartForState(
  coordinates,
  scaledImageSize,
  parkName,
  parkCode,
  svgPath,
  stateName
) {
  const svgCoordinates = getEnlargedStateTransformedValues(
    coordinates,
    svgPath
  );

  var pie = d3
    .pie()
    .sort(null)
    .startAngle(0)
    .endAngle(2 * Math.PI)
    .value(function (d) {
      return d[1];
    });

  var data_ready = pie(Object.entries(categoryCountByPark[parkName]));
  var arc = d3
    .arc()
    .innerRadius(scaledImageSize / 2 + INNER_RADIUS_OFFSET)
    .outerRadius(scaledImageSize / 2 + OUTER_RADIUS_OFFSET);
  stateOverlaySvg
    .selectAll("donut")
    .data(data_ready)
    .enter()
    .append("path")
    .classed("donut", true)
    .attr(
      "transform",
      "translate(" + svgCoordinates.x + "," + svgCoordinates.y + ")"
    )
    .attr("id", parkCode + "_donut")
    .style("fill", function (d) {
      return categoryColorScale(d.data[0]);
    })
    .style("stroke", "black")
    .style("stroke-width", "2px")
    .on("mouseover", function (d) {
      d3.select(this).style("cursor", "pointer");
      updateTopRightTextBox(parkName);
      updateInfoChartContent(parkName);
      updateAnimalLegendValues(parkName);
    })
    .on("mouseleave", function (event, d) {
      updateInfoChartContent(stateName);
      updateTopRightTextBox("");
      clearAnimalLegendUpdates();
    })
    .on("click", function () {
      reduceSizeOfStateOverlay();
      createOverlaySvg2();
      drawBarChart(parkName);
    })
    .datum(function (d) {
      return {
        lon: coordinates[0],
        lat: coordinates[1],
        scaledImageSize: scaledImageSize,
        arcData: d,
      };
    })
    .transition()
    .ease(d3.easeExp)
    .duration(2000)
    .attrTween("d", tweenPie);

  function tweenPie(b) {
    var i = d3.interpolate({ startAngle: 0, endAngle: 0 }, b.arcData);
    return function (t) {
      return arc(i(t));
    };
  }
}

function loadCategoryDonutChart(
  coordinates,
  scaledImageSize,
  parkName,
  parkCode
) {
  const projection = getProjection();
  var svgCoordinates = projection(coordinates);

  var pie = d3
    .pie()
    .sort(null)
    .startAngle(1.1 * Math.PI)
    .endAngle(3.1 * Math.PI)
    .value(function (d) {
      return d[1];
    });

  var data_ready = pie(Object.entries(categoryCountByPark[parkName]));
  var arc = d3
    .arc()
    .innerRadius(scaledImageSize / 2 + INNER_RADIUS_OFFSET)
    .outerRadius(scaledImageSize / 2 + OUTER_RADIUS_OFFSET);
  mapSvg
    .selectAll("donut")
    .data(data_ready)
    .enter()
    .append("path")
    .classed("donut", true)
    .attr(
      "transform",
      "translate(" + svgCoordinates[0] + "," + svgCoordinates[1] + ")"
    )

    .attr("id", parkCode + "_donut")
    .style("fill", function (d) {
      return categoryColorScale(d.data[0]);
    })
    .style("stroke", "black")
    .style("stroke-width", "2px")
    .datum(function (d) {
      return {
        lon: coordinates[0],
        lat: coordinates[1],
        scaledImageSize: scaledImageSize,
        arcData: d,
      };
    })
    .transition()
    .ease(d3.easeExp)
    .duration(2000)
    .attrTween("d", tweenPie);

  function tweenPie(b) {
    var i = d3.interpolate(
      { startAngle: 1.1 * Math.PI, endAngle: 1.1 * Math.PI },
      b.arcData
    );
    return function (t) {
      return arc(i(t));
    };
  }
}

function createMapSvg() {
  mapSvg = d3
    .select("#map")
    .append("svg")
    .attr("width", MAP_WIDTH + BUFFER * 2)
    .attr("height", MAP_HEIGHT + BUFFER * 2)
    .attr("viewBox", [
      0 - BUFFER,
      0 - BUFFER,
      MAP_WIDTH + BUFFER * 2,
      MAP_HEIGHT + BUFFER * 2,
    ]);

  mapSvg.on("mouseout", function () {
    updateTopLeftTextBox("");
    updateTopRightTextBox("");
    updateInfoChartContent();
  });
}

function createUSAMap(mapdata) {
  const usa = mapSvg
    .append("g")
    .append("path")
    .datum(topojson.feature(mapdata, mapdata.objects.nation))
    .attr("d", d3.geoPath());
  return usa;
}

function createOverlaySvg() {
  showOverlay();
  if (!stateOverlaySvg)
    stateOverlaySvg = d3
      .select("#overlay")
      .append("svg")
      .attr("width", MAP_WIDTH + BUFFER * 2)
      .attr("height", MAP_HEIGHT + BUFFER * 2)
      .attr("viewBox", [
        0 - BUFFER,
        0 - BUFFER,
        MAP_WIDTH + BUFFER * 2,
        MAP_HEIGHT + BUFFER * 2,
      ]);

  return stateOverlaySvg;
}

function createOverlaySvg2() {
  const mapPosition = mapSvg.node().getBoundingClientRect();
  const mapTop = mapPosition.top;
  const mapLeft = mapPosition.left;
  showOverlay2();
  if (!barChartOverlay)
    barChartOverlay = d3
      .select("#overlay2")
      .append("svg")
      .attr("width", MAP_WIDTH + BUFFER * 2)
      .attr("height", MAP_HEIGHT + BUFFER * 2)
      .attr("viewBox", [
        0 - BUFFER,
        0 - BUFFER,
        MAP_WIDTH + BUFFER * 2,
        MAP_HEIGHT + BUFFER * 2,
      ]);

  return barChartOverlay;
}

function createStateMap(mapdata) {
  const state = mapSvg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(mapdata, mapdata.objects.states).features)
    .join("path")
    .attr("vector-effect", "non-scaling-stroke")
    .attr("d", d3.geoPath())
    .style("stroke", "gray")
    .style("stroke-width", 1)
    .style("fill", function (d) {
      const stateName = d.properties.name;
      const stateCode = STATE_ABBREVIATIONS[stateName];
      return getColorFromStateCode(stateCode);
    });

  state
    .on("mouseover", function (event, d) {
      const stateName = d.properties.name;
      const stateCode = STATE_ABBREVIATIONS[stateName];
      if (parksByState[stateCode]) {
        d3.select(this).style("fill", DARK_GREEN_COLOR);
        d3.select(this).style("cursor", "pointer");
      }
      updateTopLeftTextBox(stateName);
      updateInfoChartContent(stateName);
      if (!hasStateBeenClicked) {
      }
    })
    .on("mousemove", (event) => {
      if (!hasStateBeenClicked) {
      }
    })
    .on("mouseout", function (event, d) {
      const stateName = d.properties.name;
      const stateCode = STATE_ABBREVIATIONS[stateName];
      if (!hasStateBeenClicked) {
      }
      if (parksByState[stateCode]) {
        d3.select(this).style("fill", function (d) {
          return getColorFromStateCode(stateCode);
        });
      }
    })
    .on("click", function (event, d) {
      hasStateBeenClicked = true;

      const stateName = d.properties.name;
      const stateCode = STATE_ABBREVIATIONS[stateName];
      if (parksByState[stateCode]) {
        createOverlaySvg();
        drawStateGeometry(d);
      }
    });
  return state;
}

function createStateGeometryPath(stateData, stateCode) {
  const path = stateOverlaySvg
    .append("path")
    .attr("id", "state_path")
    .attr("d", d3.geoPath().projection(null)(stateData))
    .style("stroke", "gray")
    .style("stroke-width", 1)
    .style("fill", getColorFromStateCode(stateCode));
  return path;
}

function drawStateGeometry(stateData) {
  stateOverlaySvg.selectAll("*").remove();
  const stateCode = getStateCode(stateData);
  const sizeScaler = getAcreSizeScaler(
    parksDataWhole,
    MIN_STATE_FLOWER_SIZE,
    MAX_STATE_FLOWER_SIZE
  );

  const path = createStateGeometryPath(stateData, stateCode);

  const { bbox, scaleFactor, leftOffset, topOffset } =
    getUtilityValuesForTransformCalculations(path);

  path.attr("transform", `translate(0, 0)`);
  path
    .transition()
    .duration(1000)
    .attr(
      "transform",
      `translate(${-bbox.x * scaleFactor + leftOffset}, ${
        -bbox.y * scaleFactor + topOffset
      }) scale(${scaleFactor})`
    )
    .on("end", function () {
      parksByState[stateCode].forEach((park) => {
        if (!hasIntructionBox2BeenShown) {
          hasIntructionBox2BeenShown = true;
          makeIntructionBox2Appear();
        }
        const scaledImageSize = sizeScaler(park.acres);
        projectCoordinatesOnStateMap(
          [park.lon, park.lat],
          scaledImageSize,
          park.parkCode,
          park.parkName,
          path,
          stateData.properties.name
        );
      });
    });

  stateOverlaySvg.on("click", function (event) {
    if (event.target.tagName.toLowerCase() === "svg") {
      updateTopRightTextBox("");
      if (isReducedStateOverlay) {
        hideOverlay2();
        increaseSizeofStateOverlay();
      } else {
        hideOverlay();
      }
    }
  });
}

function projectCoordinatesOnMap(
  coordinates,
  scaledImageSize,
  parkCode,
  parkName
) {
  mapAcresOnMap(coordinates, scaledImageSize, parkCode);
}

function projectCoordinatesOnStateMap(
  coordinates,
  scaledImageSize,
  parkCode,
  parkName,
  svgPath,
  stateName
) {
  mapPlantSpeciesFlowersForState(
    coordinates,
    scaledImageSize,
    parkName,
    parkCode,
    svgPath,
    stateName
  );
  loadCategoryDonutChartForState(
    coordinates,
    scaledImageSize,
    parkName,
    parkCode,
    svgPath,
    stateName
  );
}

function mapPlantSpeciesFlowersForState(
  coordinates,
  scaledImageSize,
  parkName,
  parkCode,
  svgPath,
  stateName
) {
  updateTopLeftTextBox(stateName);
  updateInfoChartContent(stateName);
  const svgCoordinates = getEnlargedStateTransformedValues(
    coordinates,
    svgPath
  );
  const translateX = svgCoordinates.x - scaledImageSize / 2,
    translateY = svgCoordinates.y - scaledImageSize / 2;
  const ellipseRadius = scaledImageSize / 4;
  const leftOffset = scaledImageSize / 2,
    topOffset = scaledImageSize / 2;

  const sizeScaler = getPlantSpeciesCountScaler();
  const numberOfPetals = sizeScaler(plantSpeciesCountByPark[parkName]);

  const petalCoordinates = constructPetalCoordinates(
    numberOfPetals,
    leftOffset,
    topOffset,
    ellipseRadius
  );

  var ellipses = stateOverlaySvg
    .selectAll("flower")
    .data(petalCoordinates)
    .enter()
    .append("ellipse")
    .attr("cx", function (d) {
      return d[0] + translateX;
    })
    .attr("cy", function (d) {
      return d[1] + translateY;
    })
    .attr("rx", ellipseRadius)
    .attr("ry", 0.3 * ellipseRadius)
    .attr("fill", "yellow")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", function (d) {
      return (
        "rotate(" +
        (180 * d[2]) / Math.PI +
        " " +
        (d[0] + translateX) +
        " " +
        (d[1] + translateY) +
        ")"
      );
    })
    .datum(function (d) {
      return {
        lon: coordinates[0],
        lat: coordinates[1],
        scaledImageSize: scaledImageSize,
        coordinateData: d,
      };
    });

  var overlayDiv = d3.select("#overlay");

  stateOverlaySvg
    .append("circle")
    .attr("cx", svgCoordinates.x)
    .attr("cy", svgCoordinates.y)
    .attr("r", scaledImageSize / 2)
    .attr("opacity", 0)
    .on("mouseover", function () {
      if (!hasFlowerBeenClicked) {
      }
      updateTopRightTextBox(parkName);
      updateInfoChartContent(parkName);
      d3.select(this).style("cursor", "pointer");
      updateAnimalLegendValues(parkName);
    })
    .on("mousemove", (event) => {
      if (!hasFlowerBeenClicked) {
      }
    })
    .on("mouseout", function () {
      if (!hasFlowerBeenClicked) {
      }
      updateTopRightTextBox("");
      updateInfoChartContent(stateName);
      clearAnimalLegendUpdates();
    })
    .on("click", function () {
      hasFlowerBeenClicked = true;

      reduceSizeOfStateOverlay();
      createOverlaySvg2();
      drawBarChart(parkName);
    });
}

function drawBarChart(parkName) {
  barChartOverlay.selectAll("*").remove();
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const width = MAP_WIDTH - margin.left - margin.right;
  const height = MAP_HEIGHT - margin.top - margin.bottom;
  const maxImageWidth = 20;
  const spacing = 2;

  var data = [];
  Object.entries(categoryCountByPark[parkName]).forEach((key, value) => {
    data.push({ category: key[0], value: key[1] });
  });

  var x = d3
    .scaleLinear()
    .domain([0, Math.max(...data.map((item) => item.value)) * 1.1])
    .range([margin.left, width]);

  data = data.filter((d) => {
    var barWidth = x(d.value) - margin.left;
    return barWidth / (maxImageWidth + 2 * spacing) >= 1;
  });

  barChartOverlay
    .append("g")
    .attr("transform", "translate(0," + (height + margin.top) + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")
    .style("font-family", "Schoolbell")
    .style("font-size", "15px");
  barChartOverlay
    .select(".domain")
    .style("stroke", "black")
    .style("fill", "none");

  var y = d3
    .scaleBand()
    .range([0, height])
    .domain(
      data.map(function (d) {
        return d.category;
      })
    )
    .padding(0.1);

  var yAxis = barChartOverlay
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(
      d3.axisLeft(y).tickFormat(function (d) {
        return d;
      })
    );
  yAxis.select(".domain").style("stroke", "black").style("fill", "none");

  yAxis
    .selectAll("text")
    .attr("x", -10)
    .style("text-anchor", "end")
    .style("font-family", "Schoolbell")
    .style("font-size", "15px");

  barChartOverlay
    .selectAll("g.bar-group")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "bar-group")
    .attr("transform", function (d) {
      return (
        "translate(" + margin.left + "," + (y(d.category) + margin.top) + ")"
      );
    })
    .each(function (d) {
      var barWidth = x(d.value) - margin.left;
      var numImages = Math.ceil(barWidth / (maxImageWidth + 2 * spacing));
      var remainingWidth = barWidth;
      for (var i = 0; i < numImages; i++) {
        var imageWidth = Math.min(remainingWidth, maxImageWidth);
        d3.select(this)
          .append("image")
          .attr("xlink:href", getImageForAnimalSpecies(d.category))
          .attr("x", i * (maxImageWidth + spacing) + spacing)
          .attr("y", 0)
          .attr("width", imageWidth)
          .attr("height", y.bandwidth());
        remainingWidth -= maxImageWidth;
      }
    });

  barChartOverlay
    .append("text")
    .attr(
      "transform",
      "translate(" +
        (width / 2 + margin.left) +
        "," +
        (height + margin.top + 45) +
        ")"
    )
    .style("text-anchor", "middle")
    .style("font-family", "Schoolbell")
    .text("Number of Species");

  barChartOverlay
    .append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-family", "Schoolbell")
    .style("font-size", "20px")
    .text("Species Distribution in " + parkName);

  barChartOverlay.on("click", function (event) {
    if (event.target.tagName.toLowerCase() === "svg") {
      hideOverlay2();
      increaseSizeofStateOverlay();
    }
  });
}

function mapPlantSpeciesFlowers(
  coordinates,
  scaledImageSize,
  parkName,
  parkCode
) {
  const projection = getProjection();
  const svgCoordinates = projection(coordinates);
  const translateX = svgCoordinates[0] - scaledImageSize / 2,
    translateY = svgCoordinates[1] - scaledImageSize / 2;
  const ellipseRadius = scaledImageSize / 4;
  const leftOffset = scaledImageSize / 2,
    topOffset = scaledImageSize / 2;

  const sizeScaler = getPlantSpeciesCountScaler();
  const numberOfPetals = sizeScaler(plantSpeciesCountByPark[parkName]);

  const petalCoordinates = constructPetalCoordinates(
    numberOfPetals,
    leftOffset,
    topOffset,
    ellipseRadius
  );

  mapSvg
    .selectAll("flower")
    .data(petalCoordinates)
    .enter()
    .append("ellipse")
    .attr("cx", function (d) {
      return d[0] + translateX;
    })
    .attr("cy", function (d) {
      return d[1] + translateY;
    })
    .attr("rx", ellipseRadius)
    .attr("ry", 0.3 * ellipseRadius)
    .attr("fill", "green")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", function (d) {
      return (
        "rotate(" +
        (180 * d[2]) / Math.PI +
        " " +
        (d[0] + translateX) +
        " " +
        (d[1] + translateY) +
        ")"
      );
    })
    .datum(function (d) {
      return {
        lon: coordinates[0],
        lat: coordinates[1],
        scaledImageSize: scaledImageSize,
        coordinateData: d,
      };
    });
}

function getAcreSizeScaler(parkData, minImageSize, maxImageSize) {
  const maxAcres = d3.max(parkData, (d) => d.acres);
  const minAcres = d3.min(parkData, (d) => d.acres);

  const sizeScaler = d3
    .scaleLog()
    .domain([minAcres, maxAcres])
    .range([minImageSize, maxImageSize]);

  return sizeScaler;
}

function getPlantSpeciesCountScaler() {
  const maxSpecies = Math.max(...Object.values(plantSpeciesCountByPark));
  const minSpecies = Math.min(...Object.values(plantSpeciesCountByPark));
  const sizeScaler = d3
    .scaleLinear()
    .domain([minSpecies, maxSpecies])
    .range([MIN_PETAL_COUNT, MAX_PETAL_COUNT]);
  const roundedScaler = function (value) {
    return Math.round(sizeScaler(value));
  };
  return roundedScaler;
}

async function loadParksData() {
  try {
    const parkData = await d3.csv("../data/parks.csv", function (d) {
      return {
        parkCode: d["Park Code"],
        parkName: d["Park Name"],
        states: d["State"].split(", "),
        acres: +d["Acres"],
        lat: +d["Latitude"],
        lon: +d["Longitude"],
      };
    });
    parksDataWhole = parkData;

    parksByState = parkData.reduce((acc, park) => {
      park.states.forEach((state) => {
        if (!acc[state]) {
          acc[state] = [];
        }
        acc[state].push(park);
      });
      return acc;
    }, {});
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

async function populateNationalParkCoordinates() {
  try {
    const parkData = await d3.csv("../data/parks.csv", function (d) {
      return {
        parkCode: d["Park Code"],
        parkName: d["Park Name"],
        state: d["State"],
        acres: +d["Acres"],
        lat: +d["Latitude"],
        lon: +d["Longitude"],
      };
    });
    const sizeScaler = getAcreSizeScaler(
      parkData,
      MIN_IMAGE_SIZE,
      MAX_IMAGE_SIZE
    );
    parkData.forEach((park) => {
      const scaledImageSize = sizeScaler(park.acres);
      projectCoordinatesOnMap(
        [park.lon, park.lat],
        scaledImageSize,
        park.parkCode,
        park.parkName
      );
    });
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function map(mapdata) {
  createMapSvg();
  const usa = createUSAMap(mapdata);
  const state = createStateMap(mapdata);
  const projection = getProjection();
  const path = d3.geoPath().projection(projection);
}

function zoomed(event, projection) {
  mapSvg.selectAll("path").attr("transform", event.transform);

  mapSvg
    .selectAll("image")
    .attr(
      "x",
      (d) =>
        event.transform.applyX(projection([d.lon, d.lat])[0]) -
        d.scaledImageSize / 2
    )
    .attr(
      "y",
      (d) =>
        event.transform.applyY(projection([d.lon, d.lat])[1]) -
        d.scaledImageSize / 2
    );

  mapSvg
    .selectAll("ellipse")
    .attr("cx", (d) => {
      const x =
        event.transform.applyX(projection([d.lon, d.lat])[0]) -
        d.scaledImageSize / 2 +
        d.coordinateData[0];

      return x;
    })
    .attr("cy", (d) => {
      const y =
        event.transform.applyY(projection([d.lon, d.lat])[1]) -
        d.scaledImageSize / 2 +
        d.coordinateData[1];
      return y;
    })
    .attr("transform", function (d) {
      const x =
        event.transform.applyX(projection([d.lon, d.lat])[0]) -
        d.scaledImageSize / 2 +
        d.coordinateData[0];
      const y =
        event.transform.applyY(projection([d.lon, d.lat])[1]) -
        d.scaledImageSize / 2 +
        d.coordinateData[1];
      return (
        "rotate(" +
        (180 * d.coordinateData[2]) / Math.PI +
        " " +
        x +
        " " +
        y +
        ")"
      );
    });

  mapSvg.selectAll(".donut").attr("transform", (d) => {
    const x = event.transform.applyX(projection([d.lon, d.lat])[0]);
    const y = event.transform.applyY(projection([d.lon, d.lat])[1]);
    return "translate(" + x + "," + y + ")";
  });
}
