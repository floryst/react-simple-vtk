import React from 'react';
import ReactDOM from 'react-dom';

import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

function createSub(sub) {
  let s = sub;
  return function(newSub) {
    if (s) {
      s.unsubscribe();
    }
    s = newSub;
  }
}

class Vtk3D extends React.Component {

  /* props
  data

  colormap
  sampleDistance (maybe search for setSampleDistance?)

  color
  */

  constructor(props) {
    super(props);

    this.fullScreenRenderer = null;
    this.container = React.createRef();
    this.pipeline = null;

    this.dataSub = createSub();
  }

  createVolumePipeline() {
    const mapper = vtkVolumeMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    mapper.setSampleDistance(1.1);

    // create color and opacity transfer functions
    const actor = vtkVolume.newInstance();
    const ctfun = vtkColorTransferFunction.newInstance();
    ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
    ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
    ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
    ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
    const ofun = vtkPiecewiseFunction.newInstance();
    ofun.addPoint(0.0, 0.0);
    ofun.addPoint(255.0, 1.0);
    actor.getProperty().setRGBTransferFunction(0, ctfun);
    actor.getProperty().setScalarOpacity(0, ofun);
    actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
    actor.getProperty().setInterpolationTypeToLinear();
    actor.getProperty().setUseGradientOpacity(0, true);
    actor.getProperty().setGradientOpacityMinimumValue(0, 2);
    actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
    actor.getProperty().setGradientOpacityMaximumValue(0, 20);
    actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
    actor.getProperty().setShade(true);
    actor.getProperty().setAmbient(0.2);
    actor.getProperty().setDiffuse(0.7);
    actor.getProperty().setSpecular(0.3);
    actor.getProperty().setSpecularPower(8.0);

    actor.setMapper(mapper);

    return { type: 'image', source, mapper, actor };
  }

  updatePipeline() {
    const renderer = this.fullScreenRenderer.getRenderer();
    const renderWindow = this.fullScreenRenderer.getRenderWindow();

    if (this.pipeline) {
      renderer.removeActor(this.pipeline.actor);
      this.pipeline = null;
    }

    if (this.props.data) {
      // TODO test for image/polydata
      this.pipeline = this.createVolumePipeline();

      this.dataSub(this.props.data.onModified(() => {
        renderWindow.render();
      }));

      renderer.addActor(this.pipeline.actor);
      renderer.resetCamera();
    }

    window.pipeline = this.pipeline; 

    renderWindow.render();
  }

  componentDidMount() {
    this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      rootContainer: this.container.current,
      containerStyle: {},
    });

    this.updatePipeline();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.prop.data) {
      this.updatePipeline();
    }
  }

  componentWillUnmount() {
    // unsubscribe
    this.dataSub();
  }

  render() {
    return (
      <div ref={this.container} />
    );
  }
}

// for image data only
const source = vtkRTAnalyticSource.newInstance();
source.setWholeExtent(0, 200, 0, 200, 0, 200);
source.setCenter(100, 100, 100);
source.setStandardDeviation(0.1);

ReactDOM.render(
  <Vtk3D data={source.getOutputData()} />,
  document.getElementById('vtkroot')
);
