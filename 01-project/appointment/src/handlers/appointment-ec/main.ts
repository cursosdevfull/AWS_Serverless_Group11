export const execute = async (event: any) => {
  console.log("appointment handler called");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: event,
    }),
  };
};
