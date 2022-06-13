import axios from 'axios';

const Axios = axios.create({
  baseURL: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
});

export default Axios;
