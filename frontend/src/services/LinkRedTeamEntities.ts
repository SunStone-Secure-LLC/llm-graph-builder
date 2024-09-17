import axios from 'axios';
import { url } from '../utils/Utils';
import { commonserverresponse, selectedRedTeamNodes, UserCredentials } from '../types';

const linkRedTeamNodes = async (userCredentials: UserCredentials, selectedNodes: selectedRedTeamNodes[]) => {
  try {
    const formData = new FormData();
    formData.append('uri', userCredentials?.uri ?? '');
    formData.append('database', userCredentials?.database ?? '');
    formData.append('userName', userCredentials?.userName ?? '');
    formData.append('password', userCredentials?.password ?? '');
    formData.append('linked_nodes_list', JSON.stringify(selectedNodes));
    const response = await axios.post<commonserverresponse>(`${url()}/link_redteam_nodes`, formData);
    return response;
  } catch (error) {
    console.log('Error Linking the Red Team nodes:', error);
    throw error;
  }
};
export default linkRedTeamNodes;
