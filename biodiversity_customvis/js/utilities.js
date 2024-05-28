var isReducedStateOverlay = false;
var isReducedBarChartOverlay = true;
function constructPetalCoordinates(
  numberOfPetals,
  leftOffset,
  topOffset,
  ellipseRadius
) {
  var coordinates = [];
  const angleOfSep = (2 * Math.PI) / numberOfPetals;
  for (var i = 0; i < numberOfPetals; i++) {
    const rsin = -ellipseRadius * Math.sin(i * angleOfSep);
    const rcos = -ellipseRadius * Math.cos(i * angleOfSep);
    coordinates.push([
      rsin + leftOffset,
      rcos + topOffset,
      Math.PI / 2 - i * angleOfSep,
      i,
    ]);
  }
  return coordinates;
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getStateCode(stateData) {
  const stateName = stateData.properties.name;
  return STATE_ABBREVIATIONS[stateName];
}

function mapAcresOnMap(coordinates, scaledImageSize, parkCode) {
  const projection = getProjection();

  var svgCoordinates = projection(coordinates);
  const image = mapSvg
    .append("image")
    .attr("x", svgCoordinates[0] - scaledImageSize / 2)
    .attr("y", svgCoordinates[1] - scaledImageSize / 2)
    .attr("width", scaledImageSize)
    .attr("height", scaledImageSize)
    .attr("id", parkCode + "_tree")
    .attr("href", "../biodiversity_customvis/images/tree.png")
    .style("pointer-events", "none")
    .datum({
      lon: coordinates[0],
      lat: coordinates[1],
      scaledImageSize: scaledImageSize,
    });

  image.on("mouseleave", function () {
    const currentTransform = d3.zoomTransform(mapSvg.node());
    const newX =
      currentTransform.applyX(svgCoordinates[0]) - scaledImageSize / 2;
    const newY =
      currentTransform.applyY(svgCoordinates[1]) - scaledImageSize / 2;
    mapSvg.selectAll("#" + parkCode + "_donut").each(function () {
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 0)
        .attr("d", function (d) {
          return d3
            .arc()
            .innerRadius(scaledImageSize / 2 + INNER_RADIUS_OFFSET)
            .outerRadius(scaledImageSize / 2 + OUTER_RADIUS_OFFSET)(d.arcData);
        });
    });
    d3.select(this)
      .transition()
      .duration(200)
      .attr("width", scaledImageSize)
      .attr("height", scaledImageSize)
      .attr("x", newX)
      .attr("y", newY);
  });
}

function getImageForAnimalSpecies(category) {
  return SPECIES_IMAGES[category];
}

function showOverlay2() {
  if (isReducedBarChartOverlay) {
    isReducedBarChartOverlay = false;
    d3.select("#overlay2")
      .style("width", "0%")
      .transition()
      .duration(OVERLAY_ANIMATION_TIME)
      .style("width", "70%");
  }
}

function hideOverlay2() {
  if (!isReducedBarChartOverlay) {
    isReducedBarChartOverlay = true;
    d3.select("#overlay2")
      .transition()
      .duration(OVERLAY_ANIMATION_TIME)
      .style("width", "0%");
  }
}

function showOverlay() {
  document.getElementById("overlay").style.display = "flex";
}

function hideOverlay() {
  onEndFunction = () => {
    document.getElementById("overlay").style.display = "none";
  };
  resizeState(onEndFunction);
}

function getUtilityValuesForTransformCalculations(path) {
  const bbox = path.node().getBBox();
  const scaleFactor = Math.min(
    MAP_WIDTH / bbox.width,
    MAP_HEIGHT / bbox.height
  );

  const leftOffset =
    (MAP_WIDTH - Math.min(scaleFactor * bbox.width, MAP_WIDTH)) / 2;
  const topOffset =
    (MAP_HEIGHT - Math.min(scaleFactor * bbox.height, MAP_HEIGHT)) / 2;

  return {
    bbox,
    scaleFactor,
    leftOffset,
    topOffset,
  };
}

function getEnlargedStateTransformedValues(pointCoordinates, path) {
  const { bbox, scaleFactor, leftOffset, topOffset } =
    getUtilityValuesForTransformCalculations(path);
  const projection = getProjection();
  const projectedPoint = projection(pointCoordinates);
  const scaledX = (projectedPoint[0] - bbox.x) * scaleFactor + leftOffset;
  const scaledY = (projectedPoint[1] - bbox.y) * scaleFactor + topOffset;
  return { x: scaledX, y: scaledY };
}

function getForestsColorScale() {
  const maxForest = Math.max(
    ...Object.values(parksByState).map((arr) => arr.length)
  );
  const sizeScaler = d3
    .scaleLinear()
    .domain([0, maxForest])
    .range([0, GREEN_COLOR_SCALE.length - 1]);
  const roundedScaler = function (value) {
    return Math.round(sizeScaler(value));
  };
  return roundedScaler;
}

function getColorFromStateCode(stateCode) {
  const indexScaler = getForestsColorScale();
  const noOfForests = parksByState[stateCode]
    ? parksByState[stateCode].length
    : 0;
  const colorIndex = indexScaler(noOfForests);
  return GREEN_COLOR_SCALE[colorIndex];
}

function updateTopRightTextBox(updatedText) {
  var textbox = document.getElementById("textbox");
  textbox.innerHTML = updatedText;
}

function updateTopLeftTextBox(updatedText) {
  var textbox = document.getElementById("textbox2");
  textbox.innerHTML = updatedText;
}

function createTooltip(divId) {
  var tootTip = d3
    .select(divId)
    .append("div")
    .style("position", "absolute")
    .style("z-index", 10)
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("text-align", "center");
  return tootTip;
}

function reduceSizeOfStateOverlay() {
  if (!isReducedStateOverlay) {
    isReducedStateOverlay = true;
    d3.select("#overlay")
      .style("width", "100%")
      .style("right", 0)
      .transition()
      .duration(OVERLAY_ANIMATION_TIME)
      .style("width", "30%")
      .on("end", () => {
        if (!hasIntructionBox3BeenShown) {
          hasIntructionBox3BeenShown = true;
          makeIntructionBox3Appear();
        }
      });
  }
}

function increaseSizeofStateOverlay() {
  if (isReducedStateOverlay) {
    isReducedStateOverlay = false;
    d3.select("#overlay")
      .transition()
      .duration(OVERLAY_ANIMATION_TIME)
      .style("width", "100%");
  }
}

function resizeState(onEndFunc) {
  stateOverlaySvg.selectAll("ellipse").style("display", "none");
  stateOverlaySvg.selectAll(".donut").style("display", "none");
  const path = d3.select("#state_path");
  path
    .transition()
    .duration(1000)
    .attr("transform", "translate(0,0) scale(1)")
    .on("end", onEndFunc);
}

function updateInfoChartContent(text = null) {
  hideForestLegendTick();
  removeCurAcreAreaImageSvg();
  removeCurFlowerAreaImageSvg();
  var titleElem = document.getElementById("info-main-title");
  titleElem.innerHTML = text ? text : "USA";
  var contentElem = document.getElementById("info-content");
  if (!text) {
    contentElem.innerHTML = NUMBER_OF_FORESTS_TEXT + parksDataWhole.length;
  } else {
    if (STATE_ABBREVIATIONS.hasOwnProperty(text)) {
      const stateCode = STATE_ABBREVIATIONS[text];
      var forestsCount = 0;
      if (parksByState.hasOwnProperty(stateCode)) {
        forestsCount = parksByState[stateCode].length;
      }
      contentElem.innerHTML = NUMBER_OF_FORESTS_TEXT + forestsCount;
      manipulateForestLegendTick(forestsCount);
    } else {
      var park = parksDataWhole.find((p) => p.parkName === text);
      contentElem.innerHTML =
        ACRES_OF_FOREST + numberWithCommas(park.acres) + " sq. ft";
      hideForestLegendTick();
      drawCurAcreAreaImageSvg(park);
      drawCurFlowerImageSvg(park);
    }
  }
}

function manipulateForestLegendTick(forestsCount) {
  const maxForest = Math.max(
    ...Object.values(parksByState).map((arr) => arr.length)
  );

  var newXValue = (forestsCount / maxForest) * FOREST_LEGEND_WIDTH;
  d3.select("#forest-legend-line")
    .attr("x1", newXValue)
    .attr("x2", newXValue)
    .attr("opacity", 1);
  if (forestsCount !== maxForest && forestsCount !== 0) {
    const forestLegendText = d3.select("#forest-legend-text");
    forestLegendText.attr("opacity", 1).attr("x", newXValue).text(forestsCount);
  }
}

function hideForestLegendTick() {
  d3.select("#forest-legend-line").attr("opacity", 0);
  d3.select("#forest-legend-text").attr("opacity", 0);
}

function drawForestLegend() {
  const maxForest = Math.max(
    ...Object.values(parksByState).map((arr) => arr.length)
  );
  const sizeScaler = d3
    .scaleLinear()
    .domain([0, maxForest])
    .range([0, GREEN_COLOR_SCALE.length - 1]);
  const roundedScaler = function (value) {
    return Math.round(sizeScaler(value));
  };

  const numRectangles = GREEN_COLOR_SCALE.length - 1;

  const legendSvg = d3
    .select("#forest-legend")
    .append("svg")
    .attr("width", FOREST_LEGEND_WIDTH)
    .attr("height", FOREST_LEGEND_HEIGHT + 20);

  const values = d3
    .range(0, numRectangles)
    .map((d) => (d / (numRectangles - 1)) * maxForest);

  legendSvg
    .selectAll("rect")
    .data(values)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * (FOREST_LEGEND_WIDTH / numRectangles))
    .attr("y", 0)
    .attr("width", FOREST_LEGEND_WIDTH / numRectangles)
    .attr("height", FOREST_LEGEND_HEIGHT)
    .attr("fill", (d) => GREEN_COLOR_SCALE[roundedScaler(d)]);

  legendSvg
    .append("text")
    .attr("x", 0)
    .attr("y", FOREST_LEGEND_HEIGHT + 20)
    .text("0");

  legendSvg
    .append("text")
    .attr("x", FOREST_LEGEND_WIDTH)
    .attr("y", FOREST_LEGEND_HEIGHT + 20)
    .attr("text-anchor", "end")
    .text(maxForest);

  legendSvg
    .append("line")
    .attr("id", "forest-legend-line")
    .attr("x1", 0)
    .attr("y1", -FOREST_LEGEND_HEIGHT)
    .attr("x2", 0)
    .attr("y2", FOREST_LEGEND_HEIGHT + 5)
    .attr("opacity", 0)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  legendSvg
    .append("text")
    .attr("id", "forest-legend-text")
    .attr("x", FOREST_LEGEND_WIDTH)
    .attr("y", FOREST_LEGEND_HEIGHT + 20)
    .text("")
    .attr("text-anchor", "middle")
    .attr("opacity", 0);
}

function removeCurAcreAreaImageSvg() {
  document.getElementById("cur-acre").style.display = "none";
  d3.select("#cur-acre").selectAll("svg").remove();
}

function removeCurFlowerAreaImageSvg() {
  document.getElementById("cur-flower").style.display = "none";
  d3.select("#cur-flower").selectAll("svg").remove();
}

function drawCurAcreAreaImageSvg(park) {
  removeCurAcreAreaImageSvg();
  document.getElementById("cur-acre").style.display = "flex";
  const sizeScalar = getAcreSizeScaler(
    parksDataWhole,
    MIN_IMAGE_SIZE,
    MAX_IMAGE_SIZE
  );

  const scaledSize = sizeScalar(park.acres);
  svg = drawAcreLegendSvg("#cur-acre", scaledSize, "Current", park.acres);
}

function drawCurFlowerImageSvg(park) {
  removeCurFlowerAreaImageSvg();
  document.getElementById("cur-flower").style.display = "flex";
  const sizeScalar = getPlantSpeciesCountScaler();
  const petals = sizeScalar(plantSpeciesCountByPark[park.parkName]);
  drawFlowerLegend(
    "#cur-flower",
    petals,
    "Current",
    plantSpeciesCountByPark[park.parkName]
  );
}

function drawAcreLegendSvg(id, imageSize, title, acres) {
  const divMin = d3.select(id);
  const svg = divMin
    .append("svg")
    .attr("width", imageSize * 1.5)
    .attr("height", imageSize + 40);

  svg
    .append("image")
    .attr("xlink:href", "../biodiversity_customvis/images/tree.png")
    .attr("width", imageSize * 1.5)
    .attr("height", imageSize)
    .attr("y", 20);

  svg
    .append("text")
    .attr("x", (imageSize * 1.5) / 2)
    .attr("y", 15)
    .text(title)
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  svg
    .append("text")
    .attr("x", (imageSize * 1.5) / 2)
    .attr("y", imageSize + 35)
    .text(numberWithCommas(acres))
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  return svg;
}

function drawMinAndMaxAcreaImageSvg() {
  const maxAcres = d3.max(parksDataWhole, (d) => d.acres);
  const minAcres = d3.min(parksDataWhole, (d) => d.acres);

  drawAcreLegendSvg("#min-acre", MIN_IMAGE_SIZE, "Min", minAcres);
  drawAcreLegendSvg("#max-acre", MAX_IMAGE_SIZE, "Max", maxAcres);
}

function drawMinAndMaxFlowerLegend() {
  const maxSpecies = Math.max(...Object.values(plantSpeciesCountByPark));
  const minSpecies = Math.min(...Object.values(plantSpeciesCountByPark));

  drawFlowerLegend("#min-flower", MIN_PETAL_COUNT, "Min", minSpecies);
  drawFlowerLegend("#max-flower", MAX_PETAL_COUNT, "Max", maxSpecies);
}

function drawFlowerLegend(id, numberOfPetals, title, plantSpecies) {
  const divMin = d3.select(id);
  const svgSize = 70;
  const width = svgSize * 1;
  const height = svgSize * 1.5;

  const svgCoordinates = { x: width / 2, y: height / 2 };
  const scaledImageSize = 50;
  const translateX = svgCoordinates.x - scaledImageSize / 2,
    translateY = svgCoordinates.y - scaledImageSize / 2;
  const ellipseRadius = scaledImageSize / 4;
  const leftOffset = scaledImageSize / 2,
    topOffset = scaledImageSize / 2;
  const petalCoordinates = constructPetalCoordinates(
    numberOfPetals,
    leftOffset,
    topOffset,
    ellipseRadius
  );

  const svg = divMin.append("svg").attr("width", width).attr("height", height);
  var ellipses = svg
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
    });

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .text(title)
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .text(numberWithCommas(plantSpecies))
    .attr("text-anchor", "middle")
    .style("font-size", "12px");
}

function makeAnimalLegend() {
  const legendDiv = d3.select("#animal-legend");
  const divWidth = legendDiv.node().clientWidth;

  const legendItemWidth = 30;
  const legendItemHeight = 30;
  const lineSpacing = 10;
  const svgWidth = 350;
  const svgHeight =
    (uniqueCategoriesArray.length / 2) * (legendItemHeight + lineSpacing) +
    lineSpacing;
  const marginLeft = 0;
  const marginTop = 0;
  const svg = legendDiv
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

  const legendItems = legend
    .selectAll(".legend-item")
    .data(uniqueCategoriesArray)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("id", (d) => d + "_legend")
    .attr("transform", (d, ind) => {
      var x = 0,
        i = ind;
      if (ind / uniqueCategoriesArray.length >= 0.5) {
        x = svgWidth / 2;
        i -= uniqueCategoriesArray.length / 2;
      }
      return (
        "translate(" + x + "," + i * (legendItemHeight + lineSpacing) + ")"
      );
    });

  legendItems
    .append("image")
    .attr("xlink:href", (d) => getImageForAnimalSpecies(d))
    .attr("width", legendItemWidth)
    .attr("height", legendItemHeight);

  legendItems
    .append("text")
    .attr("x", legendItemWidth + 5)
    .attr("y", legendItemHeight / 2)
    .attr("dy", "0.35em")
    .style("font-size", "12px")
    .text((d) => d);
}

function clearAnimalLegendUpdates() {
  uniqueCategoriesArray.forEach((d) => {
    const legendItem = d3.select(`#${d}_legend`);
    legendItem.select("text").text(d);
  });
}

function updateAnimalLegendValues(parkName) {
  var data = categoryCountByPark[parkName];
  var totalSpecies = Object.values(data).reduce((acc, val) => acc + val, 0);

  uniqueCategoriesArray.forEach((d) => {
    const legendItem = d3.select(`#${d}_legend`);
    var value = data[d] ?? 0;
    var percentage = ((value / totalSpecies) * 100).toFixed(2);
    if (!legendItem.empty()) {
      legendItem
        .select("text")
        .text(d + ": " + value + " (" + percentage + "%)");
    }
  });
}

function createTooltip(divId) {
  var tootTip = d3
    .select(divId)
    .append("div")
    .style("position", "absolute")
    .style("z-index", 1)
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("text-align", "center");
  return tootTip;
}

function closeInstructionBox() {
  document.getElementById("instruction1").style.display = "none";
}

function closeInstructionBox2() {
  document.getElementById("instruction2").style.display = "none";
}

function makeIntructionBox2Appear() {
  document.getElementById("instruction2").style.display = "flex";
}

function closeInstructionBox3() {
  document.getElementById("instruction3").style.display = "none";
}

function makeIntructionBox3Appear() {
  document.getElementById("instruction3").style.display = "flex";
}
