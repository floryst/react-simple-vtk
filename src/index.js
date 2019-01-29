import React from 'react';
import ReactDOM from 'react-dom';

import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

const { SlicingMode } = Constants;

class Vtk2D extends React.Component {

  constructor(props) {
    super(props);

    this.fullScreenRenderer = null;
    this.container = React.createRef();
  }

  createSlicePipeline() {
    const source = vtkRTAnalyticSource.newInstance();
    source.setWholeExtent(0, 200, 0, 200, 0, 200);
    source.setCenter(100, 100, 100);
    source.setStandardDeviation(0.1);

    const mapper = vtkImageMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    mapper.setSliceAtFocalPoint(true);
    mapper.setSlicingMode(SlicingMode.Z);

    const actor = vtkImageSlice.newInstance();
    actor.getProperty().setColorWindow(255);
    actor.getProperty().setColorLevel(127);
    actor.setMapper(mapper);

    return { source, mapper, actor };
  }

  componentDidMount() {
    this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      rootContainer: this.container.current,
      containerStyle: {},
    });

    this.pipeline = this.createSlicePipeline();

    const renderer = this.fullScreenRenderer.getRenderer();
    const renderWindow = this.fullScreenRenderer.getRenderWindow();
    renderer.addActor(this.pipeline.actor);
    renderer.resetCamera();
    renderWindow.render();
  }

  render() {
    return (
      <div ref={this.container} />
    );
  }
}

ReactDOM.render(<Vtk2D />, document.getElementById('vtkroot'));
