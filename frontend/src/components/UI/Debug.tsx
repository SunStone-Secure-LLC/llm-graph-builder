import React from 'react';
import { APP_SOURCES } from '../../utils/Constants';

export default class Debug extends React.Component<any, any> {
  state = { };

  render() {
    return (
      <div> 
        {`APP_SOURCES: ${APP_SOURCES}`} 
        {`process.env.ENV: ${process.env.ENV}`}
      </div>
    );
  }
}

