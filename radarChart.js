function RadarChart(
  id,
  data,
) {
  var cfg = {
    // 宽
    w: 600,
    // 高
    h: 600,
    // svg 外边距
    margin: {
      top: 100,
      right: 100,
      bottom: 100,
      left: 100,
    },
    // 显示几层圈
    levels: 5,
    // 最大值
    maxValue: 0,
    // 标签距离圆心与半径比例
    labelFactor: 1.2,
    // 标签宽
    wrapWidth: 100,
    // 曲线面积区域透明度
    opacityArea: 0.35,
    // 曲线焦点大小
    dotRadius: 4,
    // 雷达图圈透明度
    opacityCircles: 0.1,
    // 曲线宽度
    strokeWidth: 2,
    // 是否曲线
    roundStrokes: true,
    color: d3
      .scale
      .ordinal()
      .range(
        [
          '#EDC951',
          '#CC333F',
          '#00A0B0',
        ],
      )
  }

  // 查找数据中对大值 [d3.max](https://github.com/d3/d3/wiki/%E6%95%B0%E7%BB%84#d3_max)
  var maxValue = Math.max(
    cfg.maxValue,
    d3.max(
      data,
      i => d3.max(
        i.map(
          o => o.value,
        ),
      ),
    ),
  )

  // 各项数据名
  const allAxis = data[0].map(i => i.axis)
  // 数据项数量
  const total = allAxis.length
  // 最外圈半径
  const radius = Math.min(cfg.w/2, cfg.h/2)
  // 单位
  const Format = d3.format('%')
  // 切片弧度宽 or 角度
  const angleSlice = Math.PI * 2 / total
  // 半径比例
  var rScale = d3.scale.linear().range([0, radius]).domain([0, maxValue])

  // 清空画布
  d3.select(id).select('svg').remove();

  // 初始化 svg 画布
  var svg = d3.select(id).append('svg')
    .attr('width',  cfg.w + cfg.margin.left + cfg.margin.right)
    .attr('height', cfg.h + cfg.margin.top + cfg.margin.bottom)
    .attr('class', 'radar'+id)
  // 初始化 g 画布（浮层）
  var g = svg.append('g')
    .attr('transform', 'translate(' + (cfg.w/2 + cfg.margin.left) + ',' + (cfg.h/2 + cfg.margin.top) + ')')

  // 雷达背景样式设置
  const filter = g.append('defs').append('filter').attr('id','glow')
  const feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur')
  const feMerge = filter.append('feMerge')
  const feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur')
  const feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic')

  // 网格与轴样式
  var axisGrid = g.append('g').attr('class', 'axisWrapper');

  // 背景原设置
  axisGrid.selectAll('.levels')
  .data(d3.range(1, (cfg.levels+1)).reverse())
  .enter()
  .append('circle')
  .attr('class', 'gridCircle')
  .attr('r', d => radius / cfg.levels * d)
  .style('fill', '#CDCDCD')
  .style('stroke', '#CDCDCD')
  .style('fill-opacity', cfg.opacityCircles)
  .style('filter' , 'url(#glow)');

  // Y 轴间距等
  axisGrid.selectAll('.axisLabel')
  .data(d3.range(1,(cfg.levels+1)).reverse())
  .enter().append('text')
  .attr('class', 'axisLabel')
  .attr('x', 4)
  .attr('y', d => -d * radius / cfg.levels)
  .attr('dy', '0.4em')
  .style('font-size', '10px')
  .attr('fill', '#737373')
  .text(d => Format(maxValue * d / cfg.levels))

  // 浮层等内容基础画布
  var axis = axisGrid.selectAll('.axis')
    .data(allAxis)
    .enter()
    .append('g')
    .attr('class', 'axis');

  // 添加 x，y 轴
  axis.append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr('y2', (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
    .attr('class', 'line')
    .style('stroke', 'white')
    .style('stroke-width', '2px')

  // 标签
  axis.append('text')
    .attr('class', 'legend')
    .style('font-size', '11px')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('x', (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr('y', (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
    .text(d => d)
    .call(wrap, cfg.wrapWidth)

  //The radial line function
  var radarLine = d3.svg.line.radial()
    .interpolate('linear-closed')
    .radius(d => rScale(d.value))
    .angle((d,i) => i * angleSlice)

  // 曲线
  if(cfg.roundStrokes) radarLine.interpolate('cardinal-closed')

  // 背景
  var blobWrapper = g.selectAll('.radarWrapper')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'radarWrapper');

  // 曲线面积样式以及鼠标事件
  blobWrapper
    .append('path')
    .attr('class', 'radarArea')
    .attr('d', d => radarLine(d))
    .style('fill', (d,i) => cfg.color(i))
    .style('fill-opacity', cfg.opacityArea)
    .on(
      'mouseover', function (d,i) {
        d3
          .selectAll('.radarArea')
          .transition()
          .duration(200)
          .style('fill-opacity', 0.1)
        d3
          .select(this)
          .transition()
          .duration(200)
          .style('fill-opacity', 0.7)
    })
    .on('mouseout', function() {
      d3.selectAll('.radarArea')
        .transition().duration(200)
        .style('fill-opacity', cfg.opacityArea)
    })

  // 曲线
  blobWrapper.append('path')
    .attr('class', 'radarStroke')
    .attr('d', d => radarLine(d))
    .style('stroke-width', cfg.strokeWidth + 'px')
    .style('stroke', (d,i) => cfg.color(i))
    .style('fill', 'none')
    .style('filter' , 'url(#glow)')

  // 曲线焦点
  blobWrapper.selectAll('.radarCircle')
    .data(d => d)
    .enter().append('circle')
    .attr('class', 'radarCircle')
    .attr('r', cfg.dotRadius)
    .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
    .attr('cy', (d, i)=> rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
    .style('fill', (d, i, j) => cfg.color(j))
    .style('fill-opacity', 0.8);

  // 绘制函数
  function wrap(text, width) {
    text.each(function() {
      const text = d3.select(this)
      const words = text.text().split(/\s+/).reverse()
      let word = []
      let line = []
      let lineNumber = 0
      let lineHeight = 1.4
      let y = text.attr('y')
      let x = text.attr('x')
      let dy = parseFloat(text.attr('dy'))
      let tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em')

      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(' '))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word)
          }
        }
    })
  }
}
