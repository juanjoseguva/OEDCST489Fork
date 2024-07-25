/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { userApi } from '../../../redux/api/userApi';
import { useAppSelector } from '../../../redux/reduxHooks';
import { selectCurrentUserProfile } from '../../../redux/slices/currentUserSlice';
import { User, UserRole } from '../../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import translate from '../../../utils/translate';
import ConfirmActionModalComponent from '../../ConfirmActionModalComponent';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import TooltipMarkerComponent from '../../TooltipMarkerComponent';

interface EditUserModalComponentProps {
	show: boolean;
	user: User;
	handleShow: () => void;
	handleClose: () => void;
}

/**
 * Defines the edit user modal form
 * @param props props for the component
 * @returns User edit element
 */
export default function EditUserModalComponent(props: EditUserModalComponentProps) {

	const userDefaults = {
		password: '',
		confirmPassword: '',
		passwordMatch: true,
		disableDelete: false
	};

	// get current logged in user
	const currentLoggedInUser = useAppSelector(selectCurrentUserProfile) as User;

	// user apis
	const [submitUserEdits] = userApi.useEditUserMutation();
	const [submitDeleteUser] = userApi.useDeleteUsersMutation();

	// user edit form state
	const [userDetails, setUserDetails] = useState({
		...props.user,
		...userDefaults
	});

	// if editing current logged in user, do not allow user to delete their own account
	useEffect(() => {
		setUserDetails({ ...userDetails, disableDelete: false });
		if (currentLoggedInUser) {
			if (props.user.username === currentLoggedInUser.username) {
				setUserDetails(prevDetails => ({
					...prevDetails, disableDelete: true
				}));
			}
		}
	}, [currentLoggedInUser, props.user]);

	useEffect(() => {
		setUserDetails(prevDetails => ({
			...prevDetails, passwordMatch: (userDetails.password === userDetails.confirmPassword)
		}));
	}, [userDetails.password, userDetails.confirmPassword]);

	// Handlers for each type of input change
	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserDetails(prevDetails => ({
			...prevDetails, [e.target.name]: e.target.value
		}));
	};

	const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newRole = e.target.value as UserRole;
		setUserDetails(prevDetails => ({
			...prevDetails,
			role: newRole
		}));
	};

	const handleSaveChanges = async () => {
		// close modal
		props.handleClose();
		// set needed user details into a user and send to backend
		const editedUser: User = {
			id: userDetails.id, username: userDetails.username, role: userDetails.role,
			password: userDetails.password, note: userDetails.note
		};
		submitUserEdits(editedUser)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.edit.user') + props.user.username);
			})
			.catch(error => {
				showErrorNotification(translate('users.failed.to.edit.user') + props.user.username + ' ' + error.data.message);
			});
		resetPasswordFields();
	};

	const deleteUser = (username: string) => {
		submitDeleteUser(username)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.delete.user') + props.user.username);
			})
			.catch(error => {
				showErrorNotification(translate('users.failed.to.delete.user') + props.user.username + ' ' + error.data.message);
			});
	};

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('user.delete.confirm') + props.user.username + '?';
	const deleteConfirmText = translate('delete.user');
	const deleteRejectText = translate('cancel');

	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};

	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};

	const handleDeleteUser = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		// Delete the conversion using the state object, it should only require the source and destination ids set
		deleteUser(userDetails.username);
	};
	/* End Confirm Delete Modal */

	const handleShow = () => {
		props.handleShow();
	};

	const handleClose = () => {
		props.handleClose();
	};

	const resetPasswordFields = () => {
		setUserDetails({ ...userDetails, password: '', confirmPassword: '' });
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%'
	};

	return (
		<>
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteUser}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal isOpen={props.show} toggle={props.handleClose} size='lg'>
				<ModalHeader>
					{translate('edit.user')}
					<TooltipHelpComponent page='users-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='help.admin.user' helpTextId='help.admin.user' />
					</div>
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for="username">
										{translate('username')}
									</Label>
									<Input
										id="username"
										name="username"
										type="text"
										value={userDetails.username}
										onChange={handleStringChange}
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="role">
										{translate('role')}
									</Label>
									<Input
										id="role"
										name="role"
										type="select"
										value={userDetails.role}
										onChange={handleRoleChange}
										required
									>
										{Object.entries(UserRole).map(([role, val]) => (
											<option value={val} key={val}>
												{role}
											</option>
										))}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for="password">
										{translate('password')}
									</Label>
									<Input
										id="password"
										name="password"
										type="password"
										value={userDetails.password}
										onChange={e => handleStringChange(e)}
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="confirmPassword">
										{translate('password.confirm')}
									</Label>
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										value={userDetails.confirmPassword}
										onChange={e => handleStringChange(e)}
										invalid={!userDetails.passwordMatch}
									/>
									<FormFeedback>
										{translate('user.password.mismatch')}
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row>
							<Col>
								<FormGroup>
									<Label for="note">
										{translate('note')}
									</Label>
									<Input
										id="note"
										name="note"
										type="textarea"
										value={userDetails.note}
										onChange={handleStringChange}
									/>
									<FormFeedback>
										{translate('error.required')}
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
					</Container>
				</ModalBody>
				<ModalFooter>
					{userDetails.disableDelete ? (
						<div className='text-danger px-3' >
							{translate('delete.self')}
						</div>
					) : null}
					<Button color='danger' onClick={handleDeleteConfirmationModalOpen} disabled={userDetails.disableDelete}>
						{translate('delete.user')}
					</Button>
					<Button color="secondary" onClick={props.handleClose}>
						{translate('cancel')}
					</Button>
					<Button color="primary" onClick={handleSaveChanges} disabled={!userDetails.passwordMatch}>
						{translate('save.all')}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}