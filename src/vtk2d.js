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

import { createPaintContext } from './paint';
import { createSub } from './util';

const { SlicingMode } = Constants;

function createSlicePipeline() {
  const mapper = vtkImageMapper.newInstance();
  const actor = vtkImageSlice.newInstance();
  mapper.setSliceAtFocalPoint(true);
  actor.getProperty().setColorWindow(255);
  actor.getProperty().setColorLevel(127);
  actor.setMapper(mapper);

  return { mapper, actor };
}
  
class Vtk2D extends React.Component {

  /* props
  data: vtkDataset OR dataPort: algo func
  axis: string
  slice: number
  widgetManager: vtkWidgetManager
  */

    constructor(props) {
      super(props);
  
      this.fullScreenRenderer = null;
      this.container = React.createRef();
      this.dataSub = createSub();
    }
  
    updateCameraOrientation() {
      const renderer = this.fullScreenRenderer.getRenderer();
      const { mapper } = this.pipeline;
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
        case SlicingMode.Z:
          camera.setViewUp([0, 1, 0]);
          break;
        case SlicingMode.Y:
          camera.setViewUp([1, 0, 0]);
          break;
        default:
      }
      camera.setParallelProjection(true);
    }
  
    updatePipeline() {
      const { mapper } = this.pipeline;

      if (this.props.data) {
        mapper.setInputData(this.props.data);
      } else {
        mapper.setInputData(null);
      }

      if (mapper.getSlicingMode() !== SlicingMode[this.props.axis]) {
        mapper.setSlicingMode(SlicingMode[this.props.axis]);
      }

      if (mapper.getSlice() !== this.props.slice) {
        mapper.setSlice(this.props.slice);
      }
    }
  
    componentDidMount() {
      this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: this.container.current,
        containerStyle: {},
      });
      const renderer = this.fullScreenRenderer.getRenderer();

      this.pipeline = createSlicePipeline();
      // export out mapper slice state
      this.pipeline.mapper.onModified(() => {
        if (this.props.onSliceChange) {
          this.props.onSliceChange(this.pipeline.mapper.getSlice());
        }
      });

      // trigger pipeline update
      this.componentDidUpdate({});

      // TODO maybe make interactor selection a prop?
      // Scrolling Interactor
      const iStyle = vtkInteractorStyleImage.newInstance();
      iStyle.setInteractionMode('IMAGE_SLICING');
      renderer.getRenderWindow().getInteractor().setInteractorStyle(iStyle);

      if (this.props.widgetManager) {
        this.props.widgetManager.setRenderer(renderer);
      }
    }
  
    componentDidUpdate(prevProps) {
      const renderer = this.fullScreenRenderer.getRenderer();
      const renderWindow = this.fullScreenRenderer.getRenderWindow();

      if (prevProps.data !== this.props.data) {
        if (this.props.data && !this.props.data.isA('vtkImageData')) {
          console.warn('Data to <Vtk2D> is not image data');
        } else {
          this.updatePipeline();

          if (!prevProps.data && this.props.data) {
            renderer.addActor(this.pipeline.actor);
            // re-render if data has updated
            this.dataSub.update(this.props.data.onModified(() =>
              renderWindow.render()
            ));
          } else if (prevProps.data && !this.props.data) {
            renderer.removeActor(this.pipeline.actor);
            this.dataSub.unsubscribe();
          }

          this.updateCameraOrientation();
          renderer.resetCamera();

          renderWindow.render();
        }
      }

      if (prevProps.axis !== this.props.axis) {
        this.updatePipeline();
        this.updateCameraOrientation();
        renderer.resetCamera();
        renderWindow.render();
      }

      if (prevProps.slice !== this.props.slice) {
        this.updatePipeline();
        renderWindow.render();
      }
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

const cxt = createPaintContext();
window.cxt = cxt;
const Wrapped = cxt.wrapVtk(Vtk2D, 'slice');

ReactDOM.render(
  <Wrapped
    data={source.getOutputData()}
    axis="K"
    slice={10}
  />,
  document.getElementById('vtkroot')
);
