const predictClassification = require("../services/inferenceService");
const crypto = require("crypto");
const storeData = require('../services/storeData');
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;

  try {
    // Prediksi gambar
    const { confidenceScore, label, suggestion } = await predictClassification(model, image);

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
      id: id,
      result: label,
      suggestion: suggestion,
      createdAt: createdAt,
    };

    await storeData(id, data);

    const response = h.response({
      status: "success",
      message: confidenceScore > 50 ? "Model is predicted successfully" : "Model is predicted successfully",
      data,
    });
    response.code(201);
    return response;
  } catch (error) {
    // Tangani error validasi
    const response = h.response({
      status: "fail",
      message: error.message,
    });
    response.code(400); // Bad Request
    return response;
  }
}

async function getHistoriesHandler(request, h) {
  try {
    const predictionsRef = firestore.collection('predictions');
    const snapshot = await predictionsRef.get();

    if (snapshot.empty) {
      return h.response({
        status: 'fail',
        message: 'Tidak ada riwayat prediksi ditemukan.',
      }).code(404);
    }

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      history: doc.data(),
    }));

    return h.response({
      status: 'success',
      data: data,
    }).code(200);

  } catch (error) {
    console.error('Error getting predictions: ', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan saat mengambil riwayat prediksi.',
    }).code(500);
  }
}

module.exports = {
  postPredictHandler,
  getHistoriesHandler
};
