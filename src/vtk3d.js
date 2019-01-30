import React from 'react';
import ReactDOM from 'react-dom';

import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import VtkTarget from './vtktarget';

function createSub(sub) {
  let s = sub;
  const unsubscribe = () => {
    if (s) {
      s.unsubscribe();
    }
  };
  return {
    update(newSub) {
      unsubscribe();
      s = newSub;
    },
    unsubscribe,
  }
}

class Vtk3D extends React.Component {

  /* props
  data OR dataPort

  colormap

  mapperProperties (obj)
  actorProperties (obj)

  color
  */

  constructor(props) {
    super(props);

    this.fullScreenRenderer = null;
    this.container = React.createRef();
    this.pipeline = null;

    this.dataSub = createSub();
  }

  createVolumePipeline(data) {
    const mapper = vtkVolumeMapper.newInstance();
    // mapper.setInputData(data);

    // mapper.setSampleDistance(1.1);

    // create color and opacity transfer functions
    const ctfun = vtkColorTransferFunction.newInstance();
    ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
    ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
    ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
    ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);

    const ofun = vtkPiecewiseFunction.newInstance();
    ofun.addPoint(0.0, 0.0);
    ofun.addPoint(255.0, 1.0);

    const actor = vtkVolume.newInstance();
    actor.getProperty().setRGBTransferFunction(0, ctfun);
    actor.getProperty().setScalarOpacity(0, ofun);
    /*
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
    */

    actor.setMapper(mapper);

    return { type: 'image', mapper, actor };
  }

  updatePipeline() {
    const renderer = this.fullScreenRenderer.getRenderer();
    const renderWindow = this.fullScreenRenderer.getRenderWindow();

    if (this.pipeline) {
      renderer.removeActor(this.pipeline.actor);
      this.pipeline = null;
    }

    if (this.props.data || this.props.dataPort) {
      if (this.props.data) {
        // TODO test for image/polydata
        this.pipeline = this.createVolumePipeline();
        this.pipeline.mapper.setInputData(this.props.data);
      } else if (this.props.dataPort) {
        // TODO test for image/polydata
        this.pipeline = this.createVolumePipeline();
        this.pipeline.mapper.setInputConnection(this.props.dataPort);
      }
      renderer.addActor(this.pipeline.actor);
      renderer.resetCamera();
      renderWindow.render();
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
    
    if (this.props.widgetManager) {
      const renderer = this.fullScreenRenderer.getRenderer();
      this.props.widgetManager.setRenderer(renderer);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.data !== this.prop.data ||
      prevProps.dataPort !== this.prop.dataPort
    ) {
      this.updatePipeline();
    }
  }

  componentWillUnmount() {
    // unsubscribe
    this.dataSub.unsubscribe();
  }

  render() {
    return <div ref={this.container} />;
  }
}

// for image data only
const source = vtkRTAnalyticSource.newInstance();
source.setWholeExtent(0, 200, 0, 200, 0, 200);
source.setCenter(100, 100, 100);
source.setStandardDeviation(0.1);

ReactDOM.render(
  <Vtk3D
    data={source.getOutputData()}
  />,
  document.getElementById('vtkroot')
);
