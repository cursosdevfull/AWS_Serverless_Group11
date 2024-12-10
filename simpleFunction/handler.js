exports.init = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(event),
  };
};
