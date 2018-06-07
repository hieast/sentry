import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Reflux from 'reflux';
import {browserHistory} from 'react-router';
import qs from 'query-string';

import EnvironmentStore from 'app/stores/environmentStore';
import LatestContextStore from 'app/stores/latestContextStore';
import {ALL_ENVIRONMENTS_KEY} from 'app/constants';

const withEnvironmentInQueryString = WrappedComponent =>
  createReactClass({
    displayName: 'withEnvironmentInQueryString',

    propTypes: {
      location: PropTypes.object,
    },

    mixins: [Reflux.listenTo(LatestContextStore, 'onLatestContextChange')],

    getInitialState() {
      const latestContext = LatestContextStore.getInitialState();
      return {
        environment: latestContext.environment,
        organization: latestContext.organization,
      };
    },

    componentWillMount() {
      const {environment} = this.state;

      const {query, pathname} = this.props.location;

      const isDefaultEnvironment = environment === EnvironmentStore.getDefault();

      // Update the query string to match environment if they are not in sync
      if (environment) {
        if (environment.name !== query.environment) {
          if (isDefaultEnvironment) {
            delete query.environment;
          } else {
            query.environment = environment.name;
          }
          browserHistory.replace(`${pathname}?${qs.stringify(query)}`);
        }
      } else {
        if (environment === null && !isDefaultEnvironment) {
          query.environment = ALL_ENVIRONMENTS_KEY;
          browserHistory.replace(`${pathname}?${qs.stringify(query)}`);
        }
      }
    },

    onLatestContextChange({environment, organization}) {
      const environmentHasChanged = environment !== this.state.environment;

      const defaultEnvironment = EnvironmentStore.getDefault();

      if (environmentHasChanged) {
        const {query, pathname} = this.props.location;
        if (environment === defaultEnvironment) {
          // We never show environment in the query string if it's the default one
          delete query.environment;
        } else {
          // We show ?environment=__all_environments__ in the query string if 'All environments'
          // is selected and that is not the default
          const envName = environment ? environment.name : ALL_ENVIRONMENTS_KEY;
          query.environment = envName;
        }
        browserHistory.push(`${pathname}?${qs.stringify(query)}`);
      }

      this.setState({
        environment,
        organization,
      });
    },

    render() {
      return <WrappedComponent environment={this.state.environment} {...this.props} />;
    },
  });

export default withEnvironmentInQueryString;
