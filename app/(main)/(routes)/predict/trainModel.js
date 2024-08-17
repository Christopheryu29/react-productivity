// File: trainModel.js
const tf = require("@tensorflow/tfjs");
const fs = require("fs");
const path = require("path");

async function loadCsvData(filePath) {
  const csvData = fs.readFileSync(filePath, { encoding: "utf-8" });
  const parsedData = csvData
    .split("\n")
    .slice(1)
    .map((row) => row.split(",").map(Number));
  const inputs = parsedData.map((row) => [row[1], row[2]]); // Assuming columns 1 and 2 are your features
  const labels = parsedData.map((row) => {
    const label = row[3]; // Assuming column 3 is the label
    return label === 0 ? [1, 0, 0] : label === 1 ? [0, 1, 0] : [0, 0, 1];
  });
  return { inputs: tf.tensor2d(inputs), labels: tf.tensor2d(labels) };
}

async function trainModel() {
  const { inputs, labels } = await loadCsvData(
    path.resolve(__dirname, "./dataset.csv")
  );

  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [2], units: 10, activation: "relu" })
  );
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  await model.fit(inputs, labels, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.1,
  });

  await model.save("file://" + path.resolve(__dirname, "./model"));
  console.log("Model trained and saved successfully");
}

trainModel().catch(console.error);
