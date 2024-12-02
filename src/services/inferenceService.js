const tf = require("@tensorflow/tfjs-node");
const InputError = require("../exceptions/InputError");

async function predictClassification(model, image) {
  try {
    // Pastikan image adalah buffer yang valid
    if (!Buffer.isBuffer(image)) {
      throw new Error("The provided image is not a valid buffer.");
    }

    // Decoding gambar PNG dan mengubahnya menjadi tensor
    const tensor = tf.node
      .decodePng(image) // 3 untuk RGB channels
      .resizeNearestNeighbor([224, 224]) // Resize gambar ke 224x224
      .expandDims() // Tambah dimensi batch
      .toFloat(); // Konversi ke tipe data float32

    // Daftar kelas untuk prediksi
    const classes = ["Non-cancer", "Cancer"];

    // Prediksi menggunakan model
    const prediction = model.predict(tensor);
    const score = await prediction.data(); // Mengambil data prediksi

    // Menghitung confidence score
    const confidenceScore = Math.max(...score) * 100;

    const classResult = score[0] > 0.5 ? 1 : 0;
    const label = classes[classResult];

    // Memberikan saran berdasarkan label yang diprediksi
    let suggestion;

    if (label === "Cancer") {
      suggestion = "Segera periksa ke dokter!";
    }

    if (label === "Non-cancer") {
      suggestion = "Penyakit kanker tidak terdeteksi.";
    }

    // Mengembalikan hasil prediksi
    return { confidenceScore, label, suggestion };
  } catch (error) {
    throw new InputError('Terjadi kesalahan dalam melakukan prediksi');
  }
}

module.exports = predictClassification;
