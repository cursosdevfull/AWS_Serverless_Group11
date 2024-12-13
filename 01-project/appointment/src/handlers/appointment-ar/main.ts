export const execute = async (event: any) => {
  console.log("appointment handler called");
  console.log("event", event);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "appointment handler called",
      input: event,
    }),
  };
};
