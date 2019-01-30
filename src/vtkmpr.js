import React from 'react';

import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkInteractorStyleMPRSlice from 'vtk.js/Sources/Interaction/Style/InteractorStyleMPRSlice';

import { createPaintContext } from './paint';
import { createSub } from './util';

const { SlicingMode } = Constants;

function createPipeline() {
  const mapper = vtkVolumeMapper.newInstance();
  const actor = vtkVolume.newInstance();
  actor.setMapper(mapper);

  return { mapper, actor };
}
  
export default function createVtk2D(state) {
  return class Vtk2D extends React.Component {

  /* props
  data: vtkDataset OR dataPort: algo func
  axis: string
  slice: number
  widgetManager: vtkWidgetManager
  */

    constructor(props) {
      super(props);
  
      this.fullScreenRenderer = null;
      this.widgetManager = vtkWidgetManager.newInstance();
      this.container = React.createRef();
      this.dataSub = createSub();
    }
  
    updatePipeline() {
      const { mapper } = this.pipeline;

      if (this.props.data) {
        mapper.setInputData(this.props.data);
      } else {
        mapper.setInputData(null);
      }
    }
  
    componentDidMount() {
      this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: this.container.current,
        containerStyle: {},
      });
      const renderer = this.fullScreenRenderer.getRenderer();
      const renderWindow = this.fullScreenRenderer.getRenderWindow();

      this.pipeline = createPipeline();

      // trigger pipeline update
      this.componentDidUpdate({});

      const istyle = vtkInteractorStyleMPRSlice.newInstance();
      renderWindow.getInteractor().setInteractorStyle(istyle);

      istyle.setVolumeMapper(this.pipeline.mapper);
      istyle.setSliceNormal(0, 0, 1);
      const range = istyle.getSliceRange();
      istyle.setSlice((range[0] + range[1]) / 2);


      // export out mpr slice state
      // this.pipeline.mapper.onModified(() => {
      //   if (this.props.onSliceChange) {
      //     this.props.onSliceChange(this.pipeline.mapper.getSlice());
      //   }
      // });

      this.widgetManager.setRenderer(renderer);

      state.views.push({
        type: 'mpr',
        renderWindow,
        renderer,
        widgetManager: this.widgetManager,
      });
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
            renderer.addVolume(this.pipeline.actor);
            // re-render if data has updated
            this.dataSub.update(this.props.data.onModified(() =>
              renderWindow.render()
            ));
          } else if (prevProps.data && !this.props.data) {
            renderer.removeVolume(this.pipeline.actor);
            this.dataSub.unsubscribe();
          }

          renderWindow.render();
        }
      }

      if (prevProps.slice !== this.props.slice) {
        this.updatePipeline();
        renderWindow.render();
      }
    }

    componentWillUnmount() {
      const renderWindow = this.fullScreenRenderer.getRenderWindow();
      const index = state.views.findIndex((v) => v.renderWindow === renderWindow);
      if (index > -1) {
        state.view.splice(index, 1);
      }
    }
  
    render() {
      // why do I do things like this
      const containerProps = this.props.containerProps || {};
      return (
        <div ref={this.container} {...containerProps} />
      );
    }
  }
}

