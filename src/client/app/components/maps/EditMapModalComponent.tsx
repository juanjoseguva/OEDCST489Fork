/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { editMapDetails, submitEditedMap, removeMap, setCalibration } from '../../redux/actions/map';
import { showErrorNotification } from '../../utils/notifications';
import { useAppDispatch } from '../../redux/reduxHooks';
import { AppDispatch } from 'store';

interface EditMapModalProps {
	map: MapMetadata;
}

// TODO: Migrate to RTK
const EditMapModalComponent: React.FC<EditMapModalProps> = ({ map }) => {
	const [showModal, setShowModal] = useState(false);
	const handleShow = () => setShowModal(true);
	const handleClose = () => setShowModal(false);
	const dispatch: AppDispatch = useAppDispatch();
	const [nameInput, setNameInput] = useState(map.name);
	const [noteInput, setNoteInput] = useState(map.note || '');
	const [circleInput, setCircleInput] = useState(map.circleSize.toString());
	const [displayable, setDisplayable] = useState(map.displayable);

	const intl = useIntl();

	const handleSave = () => {
		const updatedMap = {
			...map,
			name: nameInput,
			note: noteInput,
			circleSize: parseFloat(circleInput),
			displayable: displayable
		};
		dispatch(editMapDetails(updatedMap));
		dispatch(submitEditedMap(updatedMap.id));
		handleClose();
	};

	const handleDelete = () => {
		const consent = window.confirm(intl.formatMessage({ id: 'map.confirm.remove' }, { name: map.name }));
		if (consent) {
			dispatch(removeMap(map.id));
			handleClose();
		}
	};

	const handleCalibrationSetting = (mode: CalibrationModeTypes) => {
		dispatch(setCalibration(mode, map.id));
		handleClose();
	};

	const toggleCircleEdit = () => {
		const regtest = /^\d+(\.\d+)?$/;
		if (regtest.test(circleInput) && parseFloat(circleInput) <= 2.0) {
			setCircleInput(circleInput);
		} else {
			showErrorNotification(intl.formatMessage({ id: 'invalid.number' }));
		}
	};

	return (
		<>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="edit.map" />
				</Button>
			</div>
			<Modal isOpen={showModal} toggle={handleClose}>
				<ModalHeader toggle={handleClose}>
					<FormattedMessage id="edit.map" />
				</ModalHeader>
				<ModalBody>
					<Form>
						<FormGroup>
							<Label for="mapName"><FormattedMessage id="map.name" /></Label>
							<Input
								id="mapName"
								value={nameInput}
								onChange={e => setNameInput(e.target.value)}
							/>
						</FormGroup>
						<FormGroup>
							<Label for='map.displayable'><FormattedMessage id='map.displayable' /></Label>
							<Input
								id="mapDisplayable"
								type="select"
								value={displayable.toString()}
								onChange={e => setDisplayable(e.target.value === 'true')}
							>
								<option value="true">{intl.formatMessage({ id: 'map.is.displayable' })}</option>
								<option value="false">{intl.formatMessage({ id: 'map.is.not.displayable' })}</option>
							</Input>
						</FormGroup>
						<FormGroup>
							<Label for="mapCircleSize"><FormattedMessage id="map.circle.size" /></Label>
							<Input
								id="mapCircleSize"
								type='number'
								value={circleInput}
								onChange={e => setCircleInput(e.target.value)}
								invalid={parseFloat(circleInput) < 0}
								onBlur={toggleCircleEdit}
							/>
						</FormGroup>
						<FormGroup>
							<Label for="mapNote"><FormattedMessage id="note" /></Label>
							<Input
								id="mapNote"
								type="textarea"
								value={noteInput}
								onChange={e => setNoteInput(e.target.value.slice(0, 30))}
							/>
						</FormGroup>
					</Form>
					<div>
						<Label><FormattedMessage id="map.filename" /></Label>
						<Input
							id='mapFilename'
							name='mapFilename'
							type='text'
							defaultValue={map.filename}
							disabled>
						</Input>
						<Button color='primary' onClick={() => handleCalibrationSetting(CalibrationModeTypes.initiate)}>
							<FormattedMessage id='map.upload.new.file' />
						</Button>
					</div>
					<div>
						<Label><FormattedMessage id="map.calibration" /></Label>
						<p>
							<FormattedMessage id={map.origin && map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
						</p>
						<Button color='primary' onClick={() => handleCalibrationSetting(CalibrationModeTypes.calibrate)}>
							<FormattedMessage id='map.calibrate' />
						</Button>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color="danger" onClick={handleDelete}>
						<FormattedMessage id="delete.map" />
					</Button>
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button color="primary" onClick={handleSave}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditMapModalComponent;