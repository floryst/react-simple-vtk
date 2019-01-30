import React from 'react';

import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPaintWidget from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

function viewTypeFromRenderType(renderType) {
	let viewType = null;
	switch (renderType) {
		case '2d':
			viewType = ViewTypes.SLICE;
			break;
		case '3d':
			viewType = ViewTypes.VOLUME;
			break;
		default:
			throw new Error('Invalid component to wrap');
	}
	return viewType;
}

export default function createPaintContext(state) {
	const widget = vtkPaintWidget.newInstance();
	const subs = [];
	let activeComponent = null;

	// assumes data is vtkImageData
	function updateWidget(data, slice, slicingMode) {
		const mode = 'IJKXYZ'.indexOf(slicingMode) % 3;
		if (data && mode > -1) {
			const ijk = [0, 0, 0];
			const position = [0, 0, 0];
			const normal = [0, 0, 0];

			// position
			ijk[mode] = slice;
			data.indexToWorldVec3(ijk, position);

			// circle/slice normal
			ijk[mode] = 1;
			data.indexToWorldVec3(ijk, normal);
			vtkMath.subtract(normal, data.getOrigin(), normal);
			vtkMath.normalize(normal);

			const manip = widget.getManipulator();
			manip.setOrigin(position);
			manip.setNormal(normal);

			const handle = widget.getWidgetState().getHandle();
			handle.rotateFromDirections(handle.getDirection(), normal);
		}
	}

	return {
		wrapVtk(VtkComponent) {
			return class extends React.Component {
				componentDidMount() {
					this.componentDidUpdate({});
				}

				componentDidUpdate(prevProps) {
					if (prevProps.data !== this.props.data) {
						// don't bother listening to data.onModified. Chances are
						// data orientation won't change...
						const { data } = this.props.data;
					}
				}

				componentWillUnmount() {
				}

				render() {
					return (
						<VtkComponent
							containerProps={{
								onMouseMove: (ev) => {
									if (activeComponent !== VtkComponent) {
										activeComponent = VtkComponent;
										updateWidget(this.props.data, this.props.slice, this.props.axis);
									}
								}
							}}
							{...this.props}
						/>
					);
				}
			};
		},
		enable() {
			state.views.forEach(({ widgetManager, type }) => {
				const viewType = viewTypeFromRenderType(type);
				const viewWidget = widgetManager.addWidget(widget, viewType);
				if (viewType === ViewTypes.SLICE) {
					widgetManager.grabFocus(widget);
					widgetManager.enablePicking();

					viewWidget.onInteractionEvent(() => {
						console.log(widget.getWidgetState().getTrueOrigin());
					});
				}
			})
		},
		disable() {
			state.views.forEach(({ widgetManager, type }) => {
				const viewType = viewTypeFromRenderType(type);
				widgetManager.removeWidget(widget);
				if (viewType === ViewTypes.SLICE) {
					widgetManager.disablePicking();
				}
			})			
		}
	}
}