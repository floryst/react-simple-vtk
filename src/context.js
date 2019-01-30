import React from 'react';
import ReactDOM from 'react-dom';

import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';

import createVtk2D from './vtk2d';
import createVtkMPR from './vtkmpr';
import createPaintContext from './paint';

function createContext() {
	// [{ renderWindow, renderer, widgetManager, type: '2d' | '3d' }]
	const views = [];

	const state = {
		views,
	};

	const paint = createPaintContext(state);

	return {
		Vtk2D: paint.wrapVtk(createVtk2D(state)),
		VtkMPR: paint.wrapVtk(createVtkMPR(state)),
		// internal
		state,
		paint,
	};
}

// for image data only
const source = vtkRTAnalyticSource.newInstance();
source.setWholeExtent(0, 200, 0, 200, 0, 200);
source.setCenter(100, 100, 100);
source.setStandardDeviation(0.1);

const ctx = createContext();
window.ctx = ctx;

const { Vtk2D, VtkMPR } = ctx;

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			slice: 0,
		};
	}

	render() {
		/*
		return (
			<Vtk2D
				data={source.getOutputData()}
				axis="K"
				slice={this.state.slice}
				onSliceChange={(slice) => this.setState({ slice })}
			/>
		);
		*/
		return (
			<VtkMPR data={source.getOutputData()} />
		);
	}
}

ReactDOM.render(
  <App />,
  document.getElementById('vtkroot')
);
