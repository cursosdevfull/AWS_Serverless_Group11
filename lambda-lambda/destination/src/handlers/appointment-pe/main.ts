export const execute = async (event: any) => {
  console.log("event", event);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "appointment-pe" }),
  };
};
