
const request = (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, options);
};

export default request;