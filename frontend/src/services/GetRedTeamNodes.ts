import axios from 'axios';
import { url } from '../utils/Utils';
import { redTeamNodesData, UserCredentials } from '../types';

export const getRedTeamNodes = async (userCredentials: UserCredentials) => {
  const formData = new FormData();
  formData.append('uri', userCredentials?.uri ?? '');
  formData.append('database', userCredentials?.database ?? '');
  formData.append('userName', userCredentials?.userName ?? '');
  formData.append('password', userCredentials?.password ?? '');
  try {
    const response = await axios.post<redTeamNodesData>(`${url()}/get_redteam_nodes`, formData);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
