import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("im ready");
});
const port = process.env.PORT || 3000;

app.get("/api/test", (req, res) => {
  const data = [
    {
      name: "test",
      age: 18,
    },
    {
      name: "test2",
      age: 19,
    },
    {
      name: "test3",
      age: 20,
    },
  ];
  res.send(data);
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
