export const getBasePath = () => {
    return process.env.NODE_ENV === 'development' ? '/client/dist/' : '/';
};

export const getBaseUrl = () => {
    return process.env.NODE_ENV ===
     'production' ?  'https://addisshcool-newdb.onrender.com' : 'http://127.0.0.1:5001';
};


