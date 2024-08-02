import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './Globe.css';

const Globe = () => {
  const svgRef = useRef();
  const infoPanelRef = useRef();
  const [geojson, setGeojson] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    d3.json('https://assets.codepen.io/911796/custom.geo.json').then(data => {
      setGeojson(data);
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateGlobe = useCallback((svg, path, graticule, projection) => {
    projection.rotate([rotation.x, rotation.y]);
    svg.selectAll('.country').attr('d', path);
    svg.selectAll('.graticule').attr('d', path(graticule));
  }, [rotation]);

  useEffect(() => {
    if (geojson) {
      const svg = d3.select(svgRef.current);
      const width = dimensions.width;
      const height = dimensions.height;

      const projection = d3.geoOrthographic()
        .fitSize([width / 2, height], geojson)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);
      const graticule = d3.geoGraticule();

      svg.attr('width', width).attr('height', height);

      // Dibujar la graticula primero
      svg.append('path')
        .attr('class', 'graticule')
        .attr('d', path(graticule()))
        .attr('fill', 'none')
        .attr('stroke', '#bcb9ca')  // Color gris claro especificado
        .attr('stroke-width', '0.5')  // Ancho de línea más fino
        .attr('vector-effect', 'non-scaling-stroke')  // Mantener grosor constante
        .attr('stroke-opacity', '0.7');  // Mayor opacidad

      // Dibujar los países después de la graticula
      svg.selectAll('.country')
        .data(geojson.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill', '#997ffa')
        .style('stroke', '#060a0f')
        .attr('class', 'country')
        .on('mouseover', function(e, d) {
          const { formal_en, economy } = d.properties;
          d3.select(infoPanelRef.current).html(`<h1>${formal_en}</h1><hr><p>${economy}</p>`);

          d3.select(this)
            .transition()
            .duration(300) // Duración de la transición
            .style('fill', '#5f3fb3');  // Color cuando el mouse está sobre el país

          svg.selectAll('.country')
            .filter(function() { return this !== d3.select(this).node(); })
            .transition()
            .duration(300) // Duración de la transición
            .style('fill', '#997ffa');  // Color normal para otros países
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(300) // Duración de la transición
            .style('fill', '#997ffa');  // Color de vuelta cuando el mouse sale
        });

      let animationFrameId;

      const handleMouseMove = e => {
        if (isMouseDown) {
          const { movementX, movementY } = e;
          setRotation(prevRotation => {
            const newRotation = { x: prevRotation.x + movementX / 2, y: prevRotation.y + movementY / 2 };
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => updateGlobe(svg, path, graticule, projection));
            return newRotation;
          });
        }
      };

      svg.on('mousedown', () => setIsMouseDown(true))
        .on('mouseup', () => setIsMouseDown(false))
        .on('mousemove', handleMouseMove);

      return () => {
        svg.on('mousedown', null)
          .on('mouseup', null)
          .on('mousemove', null);
      };
    }
  }, [geojson, isMouseDown, rotation, dimensions, updateGlobe]);

  return (
    <>
      <svg ref={svgRef}></svg>
      <article ref={infoPanelRef} className="info"></article>
    </>
  );
};

export default Globe;
