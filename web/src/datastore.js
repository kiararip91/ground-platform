/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env browser */
import {compose} from 'redux';
import {connect} from 'react-redux';
import {firestoreConnect} from 'react-redux-firebase';
import firebaseConfig from './.firebase-config.js';

// TODO: Turn into class, GndDatastore, wrapper around firebase and Redux store.

// Returns {} if key is present but value is undefined (i.e., loaded but
// empty, or undefined if key is not present (i.e., still loading,).
const getFirestoreData = (store, key) =>
  key in store.firestore.data ? store.firestore.data[key] || {} : undefined;

const getActiveProjectId = (store) => store.path.projectId;

// TOOD: Handle loading state.
const getActiveProject = (store) =>
  getActiveProjectId(store) === ':new'
    ? {}
    : getFirestoreData(store, 'activeProject');

const getMapFeatures = (store) => getFirestoreData(store, 'mapFeatures');

const getAuth = (store) => store.firebase.auth;

const getProfile = (store) => store.firebase.profile;

const updateProject = (props) => (projectId, project, auth) => {
  if (projectId === ':new') {
    return props.firestore
        .add({collection: 'projects'}, {...project, acl: getDefaultAcls(auth)})
        .then((ref) => ref.id);
  } else {
    return props.firestore
        .set({collection: 'projects', doc: projectId}, project)
        .then(() => projectId);
  }
};

const getDefaultAcls = (auth) => {
  return {
    [auth.email]: ['r', 'w'],
    'gndtestuser@gmail.com': ['r', 'w'],
  };
};

// TODO: i18n.
const updateProjectTitle = (props) => (projectId, newTitle, auth) => {
  if (projectId === ':new') {
    return props.firestore
        .collection('projects')
        .add({title: {_: newTitle}, acl: getDefaultAcls(auth)})
        .then((ref) => ref.id);
  } else {
    return props.firestore
        .collection('projects')
        .doc(projectId)
        .set({title: {_: newTitle}}, {merge: true})
        .then(() => projectId);
  }
};

const generateId = (props) => () => props.firestore.collection('ids').doc().id;

// TODO: i18n.
const getLocalizedText = (obj) => obj && (obj['_'] || obj['en'] || obj['pt']);

// Mount project data onto store based on current projectId in path.
const connectGndDatastore = compose(
    connect((store) => ({
      projectId: getActiveProjectId(store),
    })),
    firestoreConnect(({projectId}) => [
      {
        collection: 'projects',
        doc: projectId,
        storeAs: 'activeProject',
      },
      {
        collection: `projects/${projectId}/features`,
        storeAs: 'mapFeatures',
      },
    ])
);

const exportKml = () => (projectId, featureTypeId) => {
  window.location.href = `${
    firebaseConfig.functionsURL
  }/exportKml?project=${projectId}&featureType=${featureTypeId}`;
};

export {
  getActiveProject,
  getActiveProjectId,
  exportKml,
  updateProject,
  updateProjectTitle,
  getAuth,
  getProfile,
  getMapFeatures,
  getLocalizedText,
  connectGndDatastore,
  generateId,
};
