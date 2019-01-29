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
      const mapper = vtkImageMapper.newInstance();
      
      mapper.setInputConnection(this.props.dataPort);
      mapper.setSliceAtFocalPoint(true);
  
      mapper.setSlicingMode(SlicingMode[this.props.axis]);
      mapper.setSlice(this.props.slice)
  
      // Scrolling Interactor
      const iStyle = vtkInteractorStyleImage.newInstance();
      iStyle.setInteractionMode('IMAGE_SLICING');
  
      const renderer = this.fullScreenRenderer.getRenderer()
      renderer.getRenderWindow().getInteractor().setInteractorStyle(iStyle);
  
      const camera = renderer.getActiveCamera();
      const position = camera.getFocalPoint();
      // offset along the slicing axis
      const normal = mapper.getSlicingModeNormal();
      position[0] += normal[0];
      position[1] += normal[1];
      position[2] += normal[2];
      camera.setPosition(...position);
      switch (mapper.getSlicingMode()) {
        case SlicingMode.X:
          camera.setViewUp([0, 1, 0]);
          break;
        case SlicingMode.Y:
          camera.setViewUp([1, 0, 0]);
          break;
        case SlicingMode.Z:
          camera.setViewUp([0, 1, 0]);
          break;
        default:
      }
      camera.setParallelProjection(true);
  
      const actor = vtkImageSlice.newInstance();
      actor.getProperty().setColorWindow(255);
      actor.getProperty().setColorLevel(127);
      actor.setMapper(mapper);
  
      return { source, mapper, actor };
    }
  
    updatePipeline() {
      const renderer = this.fullScreenRenderer.getRenderer();
      const renderWindow = this.fullScreenRenderer.getRenderWindow();
  
      this.pipeline = this.createSlicePipeline();
  
      renderer.addActor(this.pipeline.actor);
      renderer.resetCamera();
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
  
    render() {
      return (
        <div ref={this.container} />
      );
    }
  }