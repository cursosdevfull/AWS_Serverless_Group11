export const execute = (event: any) => {
  const username = "sergio";
  console.log(username);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Appointment created",
      input: event,
    }),
  };
};
